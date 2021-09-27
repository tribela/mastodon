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

    statuses = from_redis(limit, max_id, since_id, min_id)
    statuses += from_database(limit - statuses.size, statuses.last&.id || max_id, since_id) if statuses.size < limit
    statuses
  end

  def from_database(limit, max_id, since_id)
    Status
      .as_home_timeline(@account, limit, max_id, since_id)
      .reject { |status| FeedManager.instance.filter?(:home, status, @account) }
  end
end
