# frozen_string_literal: true

class HomeFeed < Feed
  def initialize(account)
    @account = account
    super(:home, account.id)
  end

  def regenerating?
    redis.exists?("account:#{@account.id}:regeneration")
  end

  def regeneration_in_progress!
    redis.set("account:#{@account.id}:regeneration", true, nx: true, ex: 1.day.seconds)
  end

  def regeneration_finished!
    redis.del("account:#{@account.id}:regeneration")
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

  protected

  def from_database(limit, max_id, since_id, min_id)
    # return if redis feed is not full
    return [] if FeedManager.instance.timeline_size(@type, @id) * 2 < FeedManager::MAX_ITEMS

    tag_followings = TagFollow.where(account: @account).select(:tag_id)
    scope = Status.where(account: @account.following)
    scope = scope.left_outer_joins(:mentions, :tags)
    scope = scope.where(visibility: %i(public unlisted private)).or(scope.where(mentions: { account_id: @account.id })).group(Status.arel_table[:id])
    scope = scope.or(Status.where(account: @account))
    scope = scope.or(Status.where(tags: { id: tag_followings }).where(visibility: :public))
    scope = scope
            .to_a_paginated_by_id(limit, min_id: min_id, max_id: max_id, since_id: since_id)
            .reject do |status|
              if status.tags.exists?(id: tag_followings)
                FeedManager.instance.filter?(:tags, status, @account)
              else
                FeedManager.instance.filter?(:home, status, @account)
              end
            end
    scope.sort_by { |status| -status.id }
  end

  private

  def fetch_min_redis_id
    redis.zrangebyscore(key, '(0', '(+inf', limit: [0, 1]).first&.to_i
  end
end
