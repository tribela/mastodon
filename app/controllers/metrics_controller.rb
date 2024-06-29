# frozen_string_literal: true

require 'prometheus/client/formats/text'

class MetricsController < ApplicationController
  before_action :check_ip

  def show
    refresh!

    respond_to do |format|
      res = Prometheus::Client::Formats::Text.marshal(MastodonPrometheus.registry)

      format.all do
        render(plain: res, content_type: 'text/plain; version=0.0.4')
      end
    end
  end

  private

  def check_ip
    trusted_metrics = Rails.configuration.x.trusted_metrics
    head 401 unless trusted_metrics.any? { |cidr| cidr.include?(request.remote_ip) }
  end

  def refresh!
    stats = Sidekiq::Stats.new
    stats.queues.each do |k, v|
      MastodonPrometheus.get(:sidekiq_jobs_waiting_count).set(v, labels: { queue: k })
      MastodonPrometheus.get(:sidekiq_queues_latency).set(Sidekiq::Queue.new(k).latency, labels: { queue: k })
    end
    MastodonPrometheus.get(:sidekiq_retry_count).set(stats.retry_size)
    MastodonPrometheus.get(:sidekiq_dead_count).set(stats.dead_size)

    MastodonPrometheus.get(:sidekiq_total_processed_count).set(stats.processed)
    MastodonPrometheus.get(:sidekiq_total_failed_count).set(stats.failed)

    MastodonPrometheus.get(:mastodon_user_count).set(instance_presenter.user_count)
    MastodonPrometheus.get(:mastodon_status_count).set(instance_presenter.status_count)
    MastodonPrometheus.get(:mastodon_domain_count).set(instance_presenter.domain_count)

    [1, 7, 30].each do |days|
      MastodonPrometheus.get(:mastodon_sign_up_count).set(Account.local.where('created_at > ?', days.days.ago).count, labels: { days: days })
    end

    [1, 24].each do |hours|
      MastodonPrometheus.get(:mastodon_active_post).set(statuses_count(:remote, hours), labels: { by: 'remote', hours: hours })
      MastodonPrometheus.get(:mastodon_active_post).set(statuses_count(:local, hours), labels: { by: 'local', hours: hours })
    end

    [4, 24].each do |w|
      MastodonPrometheus
        .get(:mastodon_active_user)
        .set(instance_presenter.active_user_count(w), labels:
             {
               weeks: w,
             })
    end

    media_size.each do |k, v|
      MastodonPrometheus.get(:mastodon_media_size).set(v, labels: { type: k[:type], by: k[:by] })
    end

    MastodonPrometheus.get(:mastodon_database_size).set(database_size)
    MastodonPrometheus.get(:mastodon_redis_size).set(redis_size)
  end

  def instance_presenter
    @instance_presenter ||= InstancePresenter.new
  end

  def database_size
    ActiveRecord::Base.connection.execute('SELECT pg_database_size(current_database())').first['pg_database_size']
  end

  def redis_size
    RedisConfiguration.with do |redis|
      if redis.is_a?(Redis::Namespace)
        redis.redis.info
      else
        redis.info
      end['used_memory'].to_i
    end
  end

  def statuses_count(type, hours)
    min_id = Mastodon::Snowflake.id_at(hours.hours.ago, with_random: false)

    statuses = Status.where('id > ?', min_id)
    statuses = statuses.local if type == :local
    statuses = statuses.remote if type == :remote

    statuses.count
  end

  def media_size
    MediaMetric.refresh
    {
      { type: 'media_attachments', by: 'remote' } => MediaMetric.find_by(category: :media_attachments, local: false)&.file_size || 0,
      { type: 'media_attachments', by: 'local' } => MediaMetric.find_by(category: :media_attachments, local: true)&.file_size || 0,
      { type: 'custom_emojis', by: 'remote' } => MediaMetric.find_by(category: :custom_emojis, local: false)&.file_size || 0,
      { type: 'custom_emojis', by: 'local' } => MediaMetric.find_by(category: :custom_emojis, local: true)&.file_size || 0,
      { type: 'avatars', by: 'remote' } => MediaMetric.find_by(category: :avatars, local: false)&.file_size || 0,
      { type: 'avatars', by: 'local' } => MediaMetric.find_by(category: :avatars, local: true)&.file_size || 0,
      { type: 'headers', by: 'remote' } => MediaMetric.find_by(category: :headers, local: false)&.file_size || 0,
      { type: 'headers', by: 'local' } => MediaMetric.find_by(category: :headers, local: true)&.file_size || 0,
      { type: 'preview_cards', by: 'local' } => MediaMetric.find_by(category: :preview_cards, local: true)&.file_size || 0,
      { type: 'backups', by: 'local' } => MediaMetric.find_by(category: :backups, local: true)&.file_size || 0,
      { type: 'imports', by: 'local' } => MediaMetric.find_by(category: :imports, local: true)&.file_size || 0,
      { type: 'settings', by: 'local' } => MediaMetric.find_by(category: :settings, local: true)&.file_size || 0,
    }
  end
end
