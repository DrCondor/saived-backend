# frozen_string_literal: true

require "prawn"
require "prawn/table"

class ProjectPdfGenerator
  include Prawn::View

  # Brand colors (RGB)
  BRAND_PRIMARY = "171717"    # neutral-900
  BRAND_SECONDARY = "737373"  # neutral-500
  BRAND_ACCENT = "10B981"     # emerald-500
  BRAND_LIGHT = "F5F5F5"      # neutral-100
  BRAND_BORDER = "E5E5E5"     # neutral-200

  # Document settings
  PAGE_MARGIN_TOP = 40
  PAGE_MARGIN_BOTTOM = 60     # Extra space for footer
  PAGE_MARGIN_SIDES = 40
  CONTENT_WIDTH = 515         # A4 width minus margins
  FOOTER_Y_POSITION = 35      # Fixed Y position for footer

  def initialize(project, user)
    @project = project
    @user = user
    @document_number = generate_document_number
    @generated_at = Time.current
  end

  def document
    @document ||= Prawn::Document.new(
      page_size: "A4",
      margin: [PAGE_MARGIN_TOP, PAGE_MARGIN_SIDES, PAGE_MARGIN_BOTTOM, PAGE_MARGIN_SIDES],
      info: {
        Title: "Kosztorys - #{@project.name}",
        Author: user_display_name,
        Creator: "SAIVED",
        Producer: "SAIVED - Narzędzie do wyceny wnętrz",
        CreationDate: @generated_at
      }
    )
  end

  def generate
    setup_fonts
    render_header
    render_project_info
    render_sections
    render_grand_total
    render_footer_on_all_pages
    self
  end

  def to_pdf
    document.render
  end

  def filename
    sanitized_name = @project.name.gsub(/[^a-zA-Z0-9ąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s-]/i, "").gsub(/\s+/, "_")
    "kosztorys_#{sanitized_name}_#{@document_number}.pdf"
  end

  private

  def setup_fonts
    # Use Inter font for full UTF-8/Polish character support
    fonts_path = Rails.root.join("app", "assets", "fonts")

    font_families.update(
      "Inter" => {
        normal: fonts_path.join("Inter-Regular.ttf").to_s,
        bold: fonts_path.join("Inter-Bold.ttf").to_s,
        italic: fonts_path.join("Inter-Italic.ttf").to_s,
        bold_italic: fonts_path.join("Inter-BoldItalic.ttf").to_s
      }
    )
    font "Inter"
  end

  def generate_document_number
    year = Time.current.year
    sequence = @project.id.to_s.rjust(4, "0")
    "#{year}/#{sequence}"
  end

  def format_currency(amount)
    return "0,00 zł" if amount.nil? || amount == 0
    formatted = format("%.2f", amount).gsub(".", ",")
    parts = formatted.split(",")
    parts[0] = parts[0].reverse.gsub(/(\d{3})(?=\d)/, '\1 ').reverse
    "#{parts.join(',')} zł"
  end

  def format_date(date)
    months = %w[stycznia lutego marca kwietnia maja czerwca lipca sierpnia września października listopada grudnia]
    "#{date.day} #{months[date.month - 1]} #{date.year}"
  end

  def user_display_name
    @user.full_name || @user.email
  end

  # === HEADER ===
  def render_header
    # Top accent line
    stroke_color BRAND_ACCENT
    line_width 3
    stroke_horizontal_line 0, CONTENT_WIDTH, at: cursor

    move_down 20

    # Logo and company info (left side)
    bounding_box([0, cursor], width: 300, height: 60) do
      render_logo
    end

    # Document info (right side)
    bounding_box([320, cursor + 60], width: 195, height: 60) do
      font_size 9
      fill_color BRAND_SECONDARY
      text "KOSZTORYS", align: :right, style: :bold
      move_down 3
      fill_color BRAND_PRIMARY
      font_size 11
      text "Nr #{@document_number}", align: :right, style: :bold
      move_down 3
      font_size 9
      fill_color BRAND_SECONDARY
      text format_date(@generated_at), align: :right
    end

    move_down 10

    # Divider line
    stroke_color BRAND_BORDER
    line_width 0.5
    stroke_horizontal_line 0, CONTENT_WIDTH, at: cursor

    move_down 20
  end

  def render_logo
    # Text-based logo (can be replaced with actual logo image)
    fill_color BRAND_PRIMARY
    font_size 24
    text "SAIVED", style: :bold

    move_down 2
    font_size 8
    fill_color BRAND_SECONDARY
    text "Narzędzie do wyceny wnętrz"
  end

  # === PROJECT INFO ===
  def render_project_info
    # Project name box
    fill_color BRAND_LIGHT
    fill_rounded_rectangle [0, cursor], CONTENT_WIDTH, 70, 8

    bounding_box([15, cursor - 12], width: CONTENT_WIDTH - 30, height: 50) do
      font_size 8
      fill_color BRAND_SECONDARY
      text "PROJEKT"

      move_down 4
      font_size 16
      fill_color BRAND_PRIMARY
      text @project.name, style: :bold

      if @project.description.present?
        move_down 4
        font_size 9
        fill_color BRAND_SECONDARY
        text @project.description, leading: 2
      end
    end

    move_down 80

    # Prepared by info
    font_size 9
    fill_color BRAND_SECONDARY
    prepared_by = user_display_name
    prepared_by += " (#{@user.email})" if @user.full_name.present?
    text_box "Przygotował/a: #{prepared_by}",
             at: [0, cursor],
             width: CONTENT_WIDTH,
             height: 15

    move_down 25
  end

  # === SECTIONS ===
  def render_sections
    sections = @project.sections.includes(:items).order(:position, :created_at)

    sections.each_with_index do |section, index|
      render_section(section, index + 1)
    end
  end

  def render_section(section, section_number)
    items = section.items.order(:position, :created_at)

    # Check if we need a new page (minimum 100pt for section header + some content)
    start_new_page if cursor < 150

    # Section header
    render_section_header(section, section_number)

    # Items table
    if items.any?
      render_items_table(items)
    else
      render_empty_section_message
    end

    # Section subtotal
    render_section_subtotal(section)

    move_down 25
  end

  def render_section_header(section, section_number)
    # Section number badge
    fill_color BRAND_PRIMARY
    fill_rounded_rectangle [0, cursor], 24, 18, 4

    # Badge text
    fill_color "FFFFFF"
    font_size 9
    draw_text section_number.to_s, at: [8, cursor - 13], style: :bold

    # Section name
    fill_color BRAND_PRIMARY
    font_size 12
    draw_text section.name, at: [32, cursor - 13], style: :bold

    move_down 28

    # Subtle line under header
    stroke_color BRAND_BORDER
    line_width 0.5
    stroke_horizontal_line 0, CONTENT_WIDTH, at: cursor

    move_down 10
  end

  def render_items_table(items)
    table_data = []

    # Header row
    table_data << [
      { content: "#", font_style: :bold },
      { content: "Nazwa produktu", font_style: :bold },
      { content: "Ilość", font_style: :bold },
      { content: "Cena jedn.", font_style: :bold },
      { content: "Suma", font_style: :bold }
    ]

    # Item rows
    items.each_with_index do |item, index|
      status_indicator = item.status.downcase == "propozycja" ? " *" : ""

      table_data << [
        { content: (index + 1).to_s },
        { content: build_item_name_cell(item) + status_indicator },
        { content: "#{item.quantity} szt." },
        { content: format_currency(item.unit_price) },
        { content: format_currency(item.total_price), font_style: :bold }
      ]
    end

    # Render table
    table(table_data, width: CONTENT_WIDTH, cell_style: { size: 9, padding: [8, 10] }) do |t|
      # Header styling
      t.row(0).background_color = BRAND_LIGHT
      t.row(0).text_color = BRAND_PRIMARY

      # All rows
      t.cells.borders = [:bottom]
      t.cells.border_color = BRAND_BORDER
      t.cells.border_width = 0.5

      # Column widths
      t.column(0).width = 30
      t.column(1).width = 230
      t.column(2).width = 60
      t.column(3).width = 90
      t.column(4).width = 105

      # Alignments
      t.column(0).align = :center
      t.column(2).align = :center
      t.column(3).align = :right
      t.column(4).align = :right

      # Last row no bottom border
      t.row(-1).borders = []
    end

    move_down 5
  end

  def build_item_name_cell(item)
    name = item.name
    if item.note.present?
      name += "\n"
      # Note will be added as smaller text
    end
    name
  end

  def render_empty_section_message
    font_size 9
    fill_color BRAND_SECONDARY
    text "Brak pozycji w tej sekcji.", style: :italic
    move_down 10
  end

  def render_section_subtotal(section)
    subtotal = section.total_price

    # Right-aligned subtotal box
    bounding_box([CONTENT_WIDTH - 200, cursor], width: 200, height: 30) do
      fill_color BRAND_LIGHT
      fill_rounded_rectangle [0, cursor], 200, 28, 4

      bounding_box([10, cursor - 6], width: 180, height: 20) do
        font_size 9
        fill_color BRAND_SECONDARY
        text_box "Suma sekcji:",
                 at: [0, cursor],
                 width: 80,
                 height: 15

        fill_color BRAND_PRIMARY
        font_size 10
        text_box format_currency(subtotal),
                 at: [80, cursor],
                 width: 100,
                 height: 15,
                 align: :right,
                 style: :bold
      end
    end

    move_down 35
  end

  # === GRAND TOTAL ===
  def render_grand_total
    # Ensure we have enough space for grand total section (need ~120pt)
    start_new_page if cursor < 120

    move_down 10

    # Divider
    stroke_color BRAND_PRIMARY
    line_width 1
    stroke_horizontal_line 0, CONTENT_WIDTH, at: cursor

    move_down 15

    # Total box
    fill_color BRAND_PRIMARY
    fill_rounded_rectangle [CONTENT_WIDTH - 250, cursor], 250, 50, 8

    bounding_box([CONTENT_WIDTH - 240, cursor - 10], width: 230, height: 35) do
      font_size 10
      fill_color "FFFFFF"
      text_box "SUMA CAŁKOWITA",
               at: [0, cursor],
               width: 100,
               height: 15

      move_down 5
      font_size 18
      text_box format_currency(@project.total_price),
               at: [0, cursor],
               width: 230,
               height: 25,
               align: :right,
               style: :bold
    end

    move_down 60

    # Notes about proposals
    if has_proposals?
      font_size 8
      fill_color BRAND_SECONDARY
      text "* Pozycje oznaczone gwiazdką są propozycjami i mogą ulec zmianie."
      move_down 10
    end

    # Validity note
    font_size 8
    fill_color BRAND_SECONDARY
    text "Niniejszy kosztorys jest ważny przez 30 dni od daty wystawienia."
  end

  def has_proposals?
    @project.sections.joins(:items).where(project_items: { status: "Propozycja" }).exists?
  end

  # === FOOTER ===
  def render_footer_on_all_pages
    repeat(:all) do
      # Use canvas to draw at absolute page positions
      canvas do
        # Footer positioned at fixed Y from bottom
        bounding_box([PAGE_MARGIN_SIDES, FOOTER_Y_POSITION + 15], width: CONTENT_WIDTH, height: 20) do
          # Divider line
          stroke_color BRAND_BORDER
          line_width 0.5
          stroke_horizontal_line 0, CONTENT_WIDTH, at: cursor

          move_down 8

          font_size 7
          fill_color BRAND_SECONDARY

          # Left side - branding
          text_box "Wygenerowano przez SAIVED | www.saived.com",
                   at: [0, cursor],
                   width: 300,
                   height: 12

          # Right side - page number
          text_box "Strona #{page_number} z #{page_count}",
                   at: [CONTENT_WIDTH - 100, cursor],
                   width: 100,
                   height: 12,
                   align: :right
        end
      end
    end
  end
end
