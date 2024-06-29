# frozen_string_literal: true

class CreateMediaMetrics < ActiveRecord::Migration[7.1]
  def change
    create_view :media_metrics, materialized: true
  end
end
