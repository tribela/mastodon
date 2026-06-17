# frozen_string_literal: true

class AddNotNullToAccountDomainMuteColumns < ActiveRecord::Migration[8.1]
  def up
    connection.execute(<<~SQL.squish)
      DELETE FROM account_domain_mutes
      WHERE account_id IS NULL
      OR domain IS NULL
    SQL

    safety_assured do
      change_column_null :account_domain_mutes, :account_id, false
      change_column_null :account_domain_mutes, :domain, false
    end
  end

  def down
    safety_assured do
      change_column_null :account_domain_mutes, :account_id, true
      change_column_null :account_domain_mutes, :domain, true
    end
  end
end
