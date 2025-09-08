# frozen_string_literal: true

if ENV['SENTRY_DSN']
  Sentry.init do |config|
    config.dsn = ENV['SENTRY_DSN']
    config.breadcrumbs_logger = [:active_support_logger, :http_logger]

    config.excluded_exceptions += [
      'ActiveRecord::ConnectionFailed',
      'ActiveRecord::ConnectionNotEstablished',
      'ActiveRecord::RecordInvalid',
      'ActiveRecord::RecordNotUnique',
      'Aws::S3::Errors::Http500Error',
      'Aws::S3::Errors::Http502Error',
      'Aws::S3::Errors::Http503Error',
      'Aws::S3::Errors::InternalError',
      'Encoding::InvalidByteSequenceError',
      'Encoding::UndefinedConversionError',
      'Faraday::TimeoutError',
      'HTTP::ConnectionError',
      'HTTP::Redirector::EndlessRedirectError',
      'HTTP::StateError',
      'HTTP::TimeoutError',
      'Mastodon::RaceConditionError',
      'Mastodon::UnexpectedResponseError',
      'OpenSSL::SSL::SSLError',
      'RedisClient::CannotConnectError',
      'RedisClient::ReadTimeoutError',
      'Seahorse::Client::NetworkingError',
      'Stoplight::Error::RedLight',
    ]

    # Set tracesSampleRate to 1.0 to capture 100%
    # of transactions for performance monitoring.
    # We recommend adjusting this value in production
    # config.traces_sample_rate = 0.1
    # or
    config.traces_sampler = lambda do |sampling_context|
      next sampling_context[:parent_sampled] unless sampling_context[:parent_sampled].nil?

      transaction_context = sampling_context[:transaction_context]

      op = transaction_context[:op]
      transaction_name = transaction_context[:name]

      case op
      when /http/
        case transaction_name
        when /MediaProxyController/
          0.000
        else
          0.0005
        end
      when /sidekiq/
        0.00001
      else
        0.0
      end
    end

    # The profiles_sample_rate setting is relative to the traces_sample_rate setting.
    config.profiles_sample_rate = 1.0

    config.rails.report_rescued_exceptions = false
    config.environment = ENV.fetch('SENTRY_ENVIRONMENT', 'production')
  end
end
