# frozen_string_literal: true

# COOKIE_DOMAINS (see .env.production.sample) selects the parent domains whose
# subdomains share the session cookies. Empty keeps them host-only.
cookie_domains = ENV.fetch('COOKIE_DOMAINS', '').split(',').map { |domain| domain.strip.delete_prefix('.') }.reject(&:empty?)

Rails.application.configure do
  config.x.cookie_domains = cookie_domains.presence
end
