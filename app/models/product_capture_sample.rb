class ProductCaptureSample < ApplicationRecord
  belongs_to :user
  belongs_to :project_item, optional: true

  validates :url, :domain, presence: true

  # Trigger learning analysis after record is committed
  after_commit :schedule_analysis, on: :create

  private

  def schedule_analysis
    AnalyzeCaptureSampleJob.perform_later(id)
  end
end
