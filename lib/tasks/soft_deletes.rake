namespace :soft_deletes do
  desc "Hard-delete soft-deleted records older than 1 hour"
  task cleanup: :environment do
    cutoff = 1.hour.ago

    # Order matters: items first, then sections, then groups
    # to avoid cascading destroy callbacks on already-deleted children
    items_count = ProjectItem.unscoped.where("deleted_at < ?", cutoff).delete_all
    sections_count = ProjectSection.unscoped.where("deleted_at < ?", cutoff).delete_all
    groups_count = SectionGroup.unscoped.where("deleted_at < ?", cutoff).delete_all

    Rails.logger.info "[soft_deletes:cleanup] Removed #{items_count} items, #{sections_count} sections, #{groups_count} groups"
  end
end
