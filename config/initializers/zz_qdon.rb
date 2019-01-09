def host_to_url(str)
  "http#{Rails.configuration.x.use_https ? 's' : ''}://#{str}" unless str.blank?
end

base_host = Rails.configuration.x.web_domain

assets_host   = Rails.configuration.action_controller.asset_host
assets_host ||= host_to_url(base_host)

Rails.application.reloader.to_prepare do
  AboutController.content_security_policy do |p|
    p.script_src  :self, assets_host, "https://*.patreon.com", "https://liberapay.com", "https://static.cloudflareinsights.com/"
    p.worker_src  :self, :blob, assets_host, "https://*.patreon.com", "https://liberapay.com"
    p.style_src :self, :unsafe_inline, assets_host
  end

  AboutController.after_action do
    request.content_security_policy_nonce_generator = nil
  end
end
