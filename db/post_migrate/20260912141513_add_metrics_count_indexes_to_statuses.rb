# frozen_string_literal: true

class AddMetricsCountIndexesToStatuses < ActiveRecord::Migration[8.1]
  disable_ddl_transaction!

  def change
    add_index :statuses, :id, name: :index_statuses_remote_undeleted_id, algorithm: :concurrently, where: 'deleted_at IS NULL AND local = FALSE AND uri IS NOT NULL'
    add_index :statuses, :id, name: :index_statuses_local_undeleted_id, algorithm: :concurrently, where: 'deleted_at IS NULL AND (local OR uri IS NULL)'
  end
end
