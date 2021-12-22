# frozen_string_literal: true

class HomeFeed < Feed
  def initialize(account)
    @account = account
    super(:home, account.id)
  end

  def regenerating?
    redis.exists?("account:#{@account.id}:regeneration")
  end

  def get(limit, max_id = nil, since_id = nil, min_id = nil)
    limit    = limit.to_i
    max_id   = max_id.to_i if max_id.present?
    since_id = since_id.to_i if since_id.present?
    min_id   = min_id.to_i if min_id.present?

    redis_min_id = from_redis(1, nil, nil, 0).first&.id

    statuses = from_redis(limit, max_id, since_id, min_id)

    redis_sufficient = (
      (statuses.size >= limit) ||
      (redis_min_id && (
        (min_id.present? && min_id >= redis_min_id) ||
        (since_id.present? && since_id >= redis_min_id)
      ))
    )

    if not redis_sufficient
      remaining_limit = limit - statuses.size
      max_id = statuses.last.id if !statuses.empty?
      statuses += from_database(remaining_limit, max_id, since_id, min_id)
    end

    statuses
  end

  protected

  def from_database(limit, max_id, since_id, min_id)
    Status
      .as_home_timeline(@account, limit, max_id, since_id, min_id)
      .reject { |status| FeedManager.instance.filter?(:home, status, @account) }
      .sort_by { |status| -status.id }
  end
end
