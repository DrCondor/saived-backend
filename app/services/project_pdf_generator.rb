# frozen_string_literal: true

require "prawn"
require "prawn/table"

class ProjectPdfGenerator
  include Prawn::View

  # Monochromatic palette - professional document style
  BRAND_PRIMARY = "1a1a1a"    # Near black
  BRAND_SECONDARY = "666666"  # Gray for secondary text
  BRAND_LIGHT = "f5f5f5"      # Light gray (table headers only)
  BRAND_BORDER = "cccccc"     # Lines

  # Compact document settings
  PAGE_MARGIN_TOP = 25
  PAGE_MARGIN_BOTTOM = 35
  PAGE_MARGIN_SIDES = 30
  CONTENT_WIDTH = 535         # A4 width minus smaller margins
  FOOTER_Y_POSITION = 20

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
    "kosztorys_#{sanitized_name}_#{@document_number.gsub('/', '-')}.pdf"
  end

  private

  def setup_fonts
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

  def logo_path
    Rails.root.join("app", "assets", "images", "saived-logo-small.jpg").to_s
  end

  # === HEADER ===
  def render_header
    # Left side: Logo + company name
    bounding_box([0, cursor], width: 250, height: 40) do
      # Logo image
      if File.exist?(logo_path)
        image logo_path, width: 20, at: [0, cursor]
      end

      # Company name next to logo
      bounding_box([26, cursor], width: 220, height: 40) do
        fill_color BRAND_PRIMARY
        font_size 11
        text "SAIVED", style: :bold
        move_down 1
        font_size 7
        fill_color BRAND_SECONDARY
        text "Wyceny wnętrz"
      end
    end

    # Right side: Document title and number
    bounding_box([350, cursor + 40], width: 185, height: 40) do
      fill_color BRAND_PRIMARY
      font_size 14
      text "KOSZTORYS", align: :right, style: :bold
      move_down 2
      font_size 9
      fill_color BRAND_SECONDARY
      text "Nr #{@document_number}", align: :right
      move_down 1
      font_size 8
      text format_date(@generated_at), align: :right
    end

    move_down 8

    # Thin separator line
    stroke_color BRAND_BORDER
    line_width 0.5
    stroke_horizontal_line 0, CONTENT_WIDTH, at: cursor

    move_down 12
  end

  # === PROJECT INFO ===
  def render_project_info
    # Project name - simple text, no box
    font_size 10
    fill_color BRAND_PRIMARY
    text "Projekt: #{@project.name}", style: :bold

    if @project.description.present?
      move_down 2
      font_size 8
      fill_color BRAND_SECONDARY
      text @project.description
    end

    move_down 4

    # Prepared by - simple text
    font_size 8
    fill_color BRAND_SECONDARY
    prepared_by = user_display_name
    prepared_by += " (#{@user.email})" if @user.full_name.present?
    text "Przygotował/a: #{prepared_by}"

    move_down 6

    # Separator line
    stroke_color BRAND_BORDER
    line_width 0.5
    stroke_horizontal_line 0, CONTENT_WIDTH, at: cursor

    move_down 15
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

    # Check if we need a new page
    start_new_page if cursor < 100

    # Section header - simple text with number
    render_section_header(section, section_number)

    # Items table
    if items.any?
      render_items_table(items)
    else
      render_empty_section_message
    end

    # Section subtotal
    render_section_subtotal(section)

    move_down 15
  end

  def render_section_header(section, section_number)
    # Simple text header: "1. Salon"
    fill_color BRAND_PRIMARY
    font_size 9
    text "#{section_number}. #{section.name}", style: :bold

    move_down 4

    # Thin line under header
    stroke_color BRAND_BORDER
    line_width 0.5
    stroke_horizontal_line 0, CONTENT_WIDTH, at: cursor

    move_down 6
  end

  def render_items_table(items)
    table_data = []

    # Header row
    table_data << [
      { content: "#", font_style: :bold },
      { content: "Nazwa produktu", font_style: :bold },
      { content: "Ilość", font_style: :bold },
      { content: "Cena", font_style: :bold },
      { content: "Suma", font_style: :bold }
    ]

    # Item rows
    items.each_with_index do |item, index|
      status_indicator = item.status.downcase == "propozycja" ? " *" : ""
      item_name = item.name + status_indicator

      # Add note on new line if present
      if item.note.present?
        item_name += "\n#{item.note}"
      end

      table_data << [
        { content: (index + 1).to_s },
        { content: item_name },
        { content: "#{item.quantity} szt." },
        { content: format_currency(item.unit_price) },
        { content: format_currency(item.total_price), font_style: :bold }
      ]
    end

    # Compact table
    table(table_data, width: CONTENT_WIDTH, cell_style: { size: 7.5, padding: [3, 5] }) do |t|
      # Header styling
      t.row(0).background_color = BRAND_LIGHT
      t.row(0).text_color = BRAND_PRIMARY
      t.row(0).size = 7

      # All cells - thin borders
      t.cells.borders = [:bottom]
      t.cells.border_color = BRAND_BORDER
      t.cells.border_width = 0.25

      # Column widths - optimized for compact layout
      t.column(0).width = 25
      t.column(1).width = 270
      t.column(2).width = 55
      t.column(3).width = 85
      t.column(4).width = 100

      # Alignments
      t.column(0).align = :center
      t.column(2).align = :center
      t.column(3).align = :right
      t.column(4).align = :right

      # Notes in item column - smaller/lighter
      t.columns(1).rows(1..-1).each do |cell|
        if cell.content.include?("\n")
          # Style note part differently would need inline formatting
          # For now, just keep it as is
        end
      end

      # Last row no bottom border
      t.row(-1).borders = []
    end

    move_down 4
  end

  def render_empty_section_message
    font_size 7.5
    fill_color BRAND_SECONDARY
    text "Brak pozycji w tej sekcji.", style: :italic
    move_down 6
  end

  def render_section_subtotal(section)
    subtotal = section.total_price

    # Simple right-aligned text, no box
    font_size 8
    fill_color BRAND_SECONDARY

    text_box "Razem:",
             at: [CONTENT_WIDTH - 150, cursor],
             width: 50,
             height: 12,
             align: :right

    fill_color BRAND_PRIMARY
    text_box format_currency(subtotal),
             at: [CONTENT_WIDTH - 95, cursor],
             width: 95,
             height: 12,
             align: :right,
             style: :bold

    move_down 15
  end

  # === GRAND TOTAL ===
  def render_grand_total
    # Ensure space for grand total
    start_new_page if cursor < 80

    move_down 5

    # Double line separator
    stroke_color BRAND_PRIMARY
    line_width 0.75
    stroke_horizontal_line 0, CONTENT_WIDTH, at: cursor
    stroke_horizontal_line 0, CONTENT_WIDTH, at: cursor - 2

    move_down 12

    # Grand total - simple text, right aligned, no box
    font_size 9
    fill_color BRAND_SECONDARY
    text_box "SUMA CAŁKOWITA:",
             at: [CONTENT_WIDTH - 250, cursor],
             width: 120,
             height: 15,
             align: :right

    font_size 12
    fill_color BRAND_PRIMARY
    text_box format_currency(@project.total_price),
             at: [CONTENT_WIDTH - 125, cursor],
             width: 125,
             height: 15,
             align: :right,
             style: :bold

    move_down 20

    # Double line after total
    stroke_color BRAND_PRIMARY
    line_width 0.75
    stroke_horizontal_line 0, CONTENT_WIDTH, at: cursor
    stroke_horizontal_line 0, CONTENT_WIDTH, at: cursor - 2

    move_down 15

    # Notes
    font_size 6.5
    fill_color BRAND_SECONDARY

    if has_proposals?
      text "* Pozycje oznaczone gwiazdką są propozycjami."
      move_down 3
    end

    text "Kosztorys ważny 30 dni od daty wystawienia."
  end

  def has_proposals?
    @project.sections.joins(:items).where(project_items: { status: "Propozycja" }).exists?
  end

  # === FOOTER ===
  def render_footer_on_all_pages
    repeat(:all) do
      canvas do
        bounding_box([PAGE_MARGIN_SIDES, FOOTER_Y_POSITION + 12], width: CONTENT_WIDTH, height: 15) do
          # Thin separator line
          stroke_color BRAND_BORDER
          line_width 0.5
          stroke_horizontal_line 0, CONTENT_WIDTH, at: cursor

          move_down 5

          font_size 6.5
          fill_color BRAND_SECONDARY

          # Left side - branding
          text_box "SAIVED | www.saived.com",
                   at: [0, cursor],
                   width: 200,
                   height: 10

          # Right side - page number
          text_box "Strona #{page_number} / #{page_count}",
                   at: [CONTENT_WIDTH - 80, cursor],
                   width: 80,
                   height: 10,
                   align: :right
        end
      end
    end
  end
end
