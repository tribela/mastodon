# frozen_string_literal: true

Fabricator(:account_domain_mute) do
  account { Fabricate.build(:account) }
  domain { sequence { |n| "host-#{n}.example" } }
end
