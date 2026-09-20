# frozen_string_literal: true

class HomeFeed < Feed
  def initialize(account, options = {})
    @account = account
    super(:home, account.id, options)
  end

  def get(limit, max_id = nil, since_id = nil, min_id = nil)
    limit    = limit.to_i
    max_id   = max_id.to_i if max_id.present?
    since_id = since_id.to_i if since_id.present?
    min_id   = min_id.to_i if min_id.present?

    if min_id.present?
      redis_min_id = fetch_min_redis_id
      return from_redis(limit, max_id, since_id, min_id) if redis_min_id && min_id >= redis_min_id

      from_database(limit, max_id, since_id, min_id)
    else
      statuses = from_redis(limit, max_id, since_id, min_id)
      return statuses if statuses.size >= limit

      if since_id.present?
        redis_min_id = fetch_min_redis_id
        return statuses if redis_min_id.present? && since_id >= redis_min_id
      end

      remaining_limit = limit - statuses.size

      max_id = statuses.last.id unless statuses.empty?
      statuses + from_database(remaining_limit, max_id, since_id, min_id)
    end
  end

  def async_refresh
    @async_refresh ||= AsyncRefresh.new(redis_regeneration_key)
  end

  def regenerating?
    async_refresh.running?
  rescue Redis::CommandError
    retry if upgrade_redis_key!
  end

  def regeneration_in_progress!
    @async_refresh = AsyncRefresh.create(redis_regeneration_key)
  rescue Redis::CommandError
    upgrade_redis_key!
  end

  def regeneration_finished!
    async_refresh.finish!
  rescue Redis::CommandError
    retry if upgrade_redis_key!
  end

  protected

  def from_database(limit, max_id, since_id, min_id)
    tag_following_ids = TagFollow.where(account: @account).pluck(:tag_id)
    following_ids     = @account.active_relationships.pluck(:target_account_id)
    all_account_ids   = following_ids + [@account.id]

    scope = Status.where(account_id: all_account_ids, visibility: %i(public unlisted private))
      .or(Status.where(account_id: @account.id))

    if following_ids.any?
      mention_exists = Mention.where(Mention.arel_table[:status_id].eq(Status.arel_table[:id]))
        .where(account_id: @account.id)
      scope = scope.or(Status.where(account_id: following_ids).where(mention_exists.arel.exists))
    end

    if tag_following_ids.any?
      statuses_tags = Arel::Table.new(:statuses_tags)
      tag_exists = statuses_tags.where(statuses_tags[:status_id].eq(Status.arel_table[:id]))
        .where(statuses_tags[:tag_id].in(tag_following_ids))
        .project(Arel.sql('1'))
      scope = scope.or(Status.where(visibility: :public).where(tag_exists.exists))
    end

    scope = apply_options(scope)

    statuses = scope
      .includes(:tags)
      .to_a_paginated_by_id(limit, min_id: min_id, max_id: max_id, since_id: since_id)

    tag_set = tag_following_ids.to_set
    statuses.reject! do |status|
      if status.tags.any? { |tag| tag_set.include?(tag.id) }
        FeedManager.instance.filter?(:tags, status, @account)
      else
        FeedManager.instance.filter?(:home, status, @account)
      end
    end

    statuses.sort_by { |status| -status.id }
  end

  private

  # Applies the same server-side filters as Feed#from_redis to a database scope,
  # so that the `exclude_*` options keep working on the infinite-timeline fallback.
  def apply_options(scope)
    scope = scope.where.not(visibility: :direct) if @options[:exclude_direct]
    scope = scope.where(reblog_of_id: nil) if @options[:exclude_reblogs]
    scope = scope.where.missing(:quote) if @options[:exclude_quotes]
    scope = scope.where(in_reply_to_id: nil).or(scope.where(in_reply_to_id: @id)) if @options[:exclude_replies]
    scope
  end

  def fetch_min_redis_id
    redis.zrangebyscore(key, '(0', '(+inf', limit: [0, 1]).first&.to_i
  end

  def redis_regeneration_key
    @redis_regeneration_key = "account:#{@account.id}:regeneration"
  end

  def upgrade_redis_key!
    if redis.type(redis_regeneration_key) == 'string'
      redis.del(redis_regeneration_key)
      regeneration_in_progress!
      true
    end
  end
end
