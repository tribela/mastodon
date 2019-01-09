# frozen_string_literal: true
Account
  .local.without_suspended
  .where('accounts.id > 0')
  .where('accounts.created_at < ?', 30.days.ago)
  .where(note: '')
  .where(display_name: '')
  .where(avatar_file_name: nil)
  .where(
    Account.arel_table[:fields].eq(nil).or(
      Account.arel_table[:fields].eq([])
    )
  )
  .joins(:account_stat)
  .where('account_stats.statuses_count': 0)
  .find_in_batches do |accs|
    accs.each do |acc|
      p "#{acc.id} #{acc.username}"
      # SuspendAccountService.new.call(acc, reserve_username: false)
    end
  end
