# frozen_string_literal: true

class DropImports < ActiveRecord::Migration[7.1]
  def up
    drop_view :media_metrics, materialized: true
    drop_table :imports
    create_view :media_metrics, version: 2, materialized: true
  end

  def down
    raise ActiveRecord::IrreversibleMigration
  end
end
