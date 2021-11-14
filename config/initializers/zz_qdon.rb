if Rails.env.production?
  Rails.application.reloader.to_prepare do
    default_directives = Rails.application.config.content_security_policy.directives.deep_dup

    AboutController.content_security_policy do |p|
      p.script_src *default_directives['script-src'], 'https://*.patreon.com', 'https://liberapay.com', 'https://static.cloudflareinsights.com/'
      p.worker_src *default_directives['worker-src'], 'https://*.patreon.com', 'https://liberapay.com' 
      p.style_src *default_directives['style-src'], :unsafe_inline 
      p.img_src *default_directives['img-src'], 'https://liberapay.com' 
    end

    AboutController.after_action do
      request.content_security_policy_nonce_generator = nil
    end
  end
end
