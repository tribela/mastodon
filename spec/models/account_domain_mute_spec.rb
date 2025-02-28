# frozen_string_literal: true

require 'rails_helper'

RSpec.describe AccountDomainMute do
  let(:account) { Fabricate(:account) }

  it 'removes muting cache after creation' do
    Rails.cache.write("mute_domains_for:#{account.id}", 'a.domain.already.muted')

    expect { mute_domain_for_account('a.domain.muted.later') }
      .to change { account_has_mute_domains_cache? }.to(false)
  end

  it 'removes muting cache after destruction' do
    mute = mute_domain_for_account('domain')
    Rails.cache.write("mute_domains_for:#{account.id}", 'domain')

    expect { mute.destroy! }
      .to change { account_has_mute_domains_cache? }.to(false)
  end

  private

  def mute_domain_for_account(domain)
    Fabricate(:account_domain_mute, account: account, domain: domain)
  end

  def account_has_mute_domains_cache?
    Rails.cache.exist?("mute_domains_for:#{account.id}")
  end
end
