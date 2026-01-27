module Api
  module V1
    class ProjectsController < BaseController
      include Rails.application.routes.url_helpers
      def index
        projects = current_user.projects
                               .includes(:sections, :section_groups)
                               .order(:position, :created_at)

        render json: {
          projects: projects.map { |project|
            {
              id: project.id,
              name: project.name,
              favorite: project.favorite,
              position: project.position,
              total_price: project.total_price,
              section_groups: project.section_groups.order(:position, :created_at).map { |group|
                {
                  id: group.id,
                  name: group.name,
                  position: group.position
                }
              },
              sections: project.sections.order(:position, :created_at).map { |section|
                {
                  id: section.id,
                  name: section.name,
                  position: section.position,
                  section_group_id: section.section_group_id
                }
              }
            }
          }
        }
      end

      def show
        project = current_user.projects
                              .includes(:section_groups, sections: { items: { attachment_attachment: :blob } })
                              .find(params[:id])

        render json: project_json(project)
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Not found" }, status: :not_found
      end

      # POST /api/v1/projects
      def create
        project = current_user.owned_projects.new(project_params)

        ActiveRecord::Base.transaction do
          project.save!
          ProjectMembership.create!(project: project, user: current_user, role: "owner")
        end

        render json: project_json(project), status: :created
      rescue ActiveRecord::RecordInvalid => e
        render json: { errors: e.record.errors.full_messages }, status: :unprocessable_entity
      end

      # PATCH /api/v1/projects/:id
      def update
        project = current_user.projects.find(params[:id])

        if project.update(project_params)
          render json: project_json(project)
        else
          render json: { errors: project.errors.full_messages }, status: :unprocessable_entity
        end
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Not found" }, status: :not_found
      end

      # DELETE /api/v1/projects/:id
      def destroy
        project = current_user.projects.find(params[:id])
        project.destroy
        head :no_content
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Not found" }, status: :not_found
      end

      # POST /api/v1/projects/:id/toggle_favorite
      def toggle_favorite
        project = current_user.projects.find(params[:id])
        project.update!(favorite: !project.favorite)
        render json: { id: project.id, favorite: project.favorite }
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Not found" }, status: :not_found
      end

      # POST /api/v1/projects/reorder_all
      # Reorders user's projects
      def reorder_all
        ActiveRecord::Base.transaction do
          params[:project_order].each_with_index do |project_id, index|
            project = current_user.projects.find(project_id)
            project.update!(position: index)
          end
        end

        projects = current_user.projects.order(:position, :created_at)
        render json: {
          projects: projects.map { |project|
            {
              id: project.id,
              name: project.name,
              favorite: project.favorite,
              position: project.position,
              total_price: project.total_price
            }
          }
        }
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Not found" }, status: :not_found
      rescue ActiveRecord::RecordInvalid => e
        render json: { errors: e.record.errors.full_messages }, status: :unprocessable_entity
      end

      # GET /api/v1/projects/:id/pdf
      # Generates and returns a PDF cost estimate for the project
      def pdf
        project = current_user.projects
                              .includes(:section_groups, sections: { items: { attachment_attachment: :blob } })
                              .find(params[:id])

        generator = ProjectPdfGenerator.new(project, current_user)
        generator.generate

        send_data generator.to_pdf,
                  filename: generator.filename,
                  type: "application/pdf",
                  disposition: "inline"
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Not found" }, status: :not_found
      end

      # POST /api/v1/projects/:id/reorder
      # Handles item reordering within sections and moving between sections
      # Also handles section reordering
      def reorder
        project = current_user.projects.find(params[:id])

        ActiveRecord::Base.transaction do
          # Handle item moves
          if params[:item_moves].present?
            params[:item_moves].each do |move|
              item = ProjectItem.joins(:project_section)
                                .where(project_sections: { project_id: project.id })
                                .find(move[:item_id])

              target_section = project.sections.find(move[:section_id])

              # Move item to new section if different
              if item.project_section_id != target_section.id
                item.project_section_id = target_section.id
              end

              item.position = move[:position]
              item.save!
            end
          end

          # Handle section reordering
          if params[:section_order].present?
            params[:section_order].each_with_index do |section_id, index|
              section = project.sections.find(section_id)
              section.update!(position: index)
            end
          end

          # Handle group reordering
          if params[:group_order].present?
            params[:group_order].each_with_index do |group_id, index|
              group = project.section_groups.find(group_id)
              group.update!(position: index)
            end
          end

          # Handle section moves between groups
          if params[:section_moves].present?
            params[:section_moves].each do |move|
              section = project.sections.find(move[:section_id])
              section.update!(
                section_group_id: move[:group_id],
                position: move[:position]
              )
            end
          end
        end

        render json: project_json(project.reload)
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Not found" }, status: :not_found
      rescue ActiveRecord::RecordInvalid => e
        render json: { errors: e.record.errors.full_messages }, status: :unprocessable_entity
      end

      private

      def project_params
        params.require(:project).permit(:name, :description, :favorite, :position)
      end

      def favorite_item_ids
        @favorite_item_ids ||= current_user.item_favorites.pluck(:project_item_id).to_set
      end

      def project_json(project)
        {
          id: project.id,
          name: project.name,
          description: project.description,
          favorite: project.favorite,
          position: project.position,
          total_price: project.total_price,
          section_groups: project.section_groups.order(:position, :created_at).map { |group|
            {
              id: group.id,
              name: group.name,
              position: group.position
            }
          },
          sections: project.sections.order(:position, :created_at).map { |section|
            {
              id: section.id,
              name: section.name,
              position: section.position,
              section_group_id: section.section_group_id,
              total_price: section.total_price,
              items: section.items.order(:position, :created_at).map { |item|
                {
                  id: item.id,
                  name: item.name,
                  note: item.note,
                  quantity: item.quantity,
                  unit_type: item.unit_type,
                  unit_price: item.unit_price,
                  total_price: item.total_price,
                  currency: item.currency,
                  category: item.category,
                  dimensions: item.dimensions,
                  status: item.status,
                  external_url: item.external_url,
                  discount_label: item.discount_label,
                  discount_percent: item.discount_percent,
                  discount_code: item.discount_code,
                  original_unit_price: item.original_unit_price_cents ? item.original_unit_price_cents / 100.0 : nil,
                  thumbnail_url: item.thumbnail_url,
                  position: item.position,
                  # Contractor fields
                  item_type: item.item_type,
                  address: item.address,
                  phone: item.phone,
                  attachment_url: item.attachment.attached? ? rails_blob_url(item.attachment, only_path: true) : nil,
                  attachment_filename: item.attachment.attached? ? item.attachment.filename.to_s : nil,
                  # Favorite
                  favorite: favorite_item_ids.include?(item.id)
                }
              }
            }
          }
        }
      end
    end
  end
end
