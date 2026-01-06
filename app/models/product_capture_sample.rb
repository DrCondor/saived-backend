class ProductCaptureSample < ApplicationRecord
  belongs_to :user
  belongs_to :project_item, optional: true

  # Ransack whitelist for ActiveAdmin
  def self.ransackable_attributes(auth_object = nil)
    %w[id user_id project_item_id url domain created_at updated_at]
  end

  def self.ransackable_associations(auth_object = nil)
    %w[user project_item]
  end

  validates :url, :domain, presence: true

  # Trigger learning analysis after record is committed
  after_commit :schedule_analysis, on: :create

  private

  def schedule_analysis
    AnalyzeCaptureSampleJob.perform_later(id)
  end
end
