# frozen_string_literal: true

class AddIndexToMediaMetrics < ActiveRecord::Migration[8.0]
  def change
    safety_assured { add_index :media_metrics, [:category, :local], name: 'index_media_metrics_on_category_and_local', unique: true }
  end
end
