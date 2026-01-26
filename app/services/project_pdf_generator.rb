# frozen_string_literal: true

require "prawn"
require "prawn/table"
require "open-uri"

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

  # Image optimization settings
  THUMBNAIL_MAX_SIZE = 150    # Max dimension for item thumbnails (px)
  LOGO_MAX_SIZE = 400         # Max dimension for company logo (px)
  JPEG_QUALITY = 85           # JPEG compression quality (0-100)

  def initialize(project, user)
    @project = project
    @user = user
    @document_number = generate_document_number
    @generated_at = Time.current
  end

  def document
    @document ||= Prawn::Document.new(
      page_size: "A4",
      margin: [ PAGE_MARGIN_TOP, PAGE_MARGIN_SIDES, PAGE_MARGIN_BOTTOM, PAGE_MARGIN_SIDES ],
      info: {
        Title: "Kosztorys - #{@project.name}",
        Author: user_display_name,
        Creator: "SAIVED",
        Producer: "SAIVED - Design More. Manage Less.",
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
    # Use cropped version to remove edge artifacts/shadows
    Rails.root.join("app", "assets", "images", "saived-logo-cropped.jpg").to_s
  end

  def download_image(url_or_attachment)
    return nil if url_or_attachment.blank?

    if url_or_attachment.is_a?(String)
      # Remote URL
      URI.open(url_or_attachment, read_timeout: 5, open_timeout: 5).read
    else
      # ActiveStorage attachment
      url_or_attachment.download
    end
  rescue StandardError => e
    Rails.logger.warn "Failed to download image: #{e.message}"
    nil
  end

  # Optimize image for PDF embedding: resize and convert to JPEG
  # Returns optimized binary data or nil on failure
  def optimize_image(image_data, max_size:)
    return nil if image_data.blank?

    require "image_processing/vips"
    require "tempfile"

    # Write binary data to tempfile (vips needs file path or IO, not raw string)
    input_file = Tempfile.new([ "pdf_image", ".bin" ], binmode: true)
    input_file.write(image_data)
    input_file.rewind

    # Process with vips: resize to fit within max_size, convert to JPEG
    processed = ImageProcessing::Vips
      .source(input_file)
      .resize_to_limit(max_size, max_size)
      .saver(quality: JPEG_QUALITY)
      .convert("jpeg")
      .call

    processed.read
  rescue StandardError => e
    Rails.logger.warn "Failed to optimize image: #{e.message}"
    # Return original data as fallback (will still work, just larger)
    image_data
  ensure
    input_file&.close
    input_file&.unlink
    processed&.close if processed.respond_to?(:close)
  end

  # === HEADER ===
  def render_header
    header_start_y = cursor
    org = @user.organization
    has_company_logo = org&.logo&.attached?

    # Right side: Document title and number
    fill_color BRAND_PRIMARY
    font_size 14
    draw_text "KOSZTORYS", at: [ CONTENT_WIDTH - 85, header_start_y - 10 ], style: :bold

    fill_color BRAND_SECONDARY
    font_size 9
    draw_text "Nr #{@document_number}", at: [ CONTENT_WIDTH - 85, header_start_y - 22 ]

    font_size 8
    draw_text format_date(@generated_at), at: [ CONTENT_WIDTH - 85, header_start_y - 32 ]

    # Left side: Organization info - track actual height used
    left_y = header_start_y

    # Company logo
    if has_company_logo
      begin
        logo_data = download_image(org.logo)
        if logo_data
          # Optimize: resize to max 400px and convert to JPEG
          optimized_logo = optimize_image(logo_data, max_size: LOGO_MAX_SIZE)
          if optimized_logo
            logo_io = StringIO.new(optimized_logo)
            # Large company logo - prominent placement
            image logo_io, at: [ 0, left_y ], fit: [ 180, 70 ]
          end
        end
      rescue StandardError => e
        Rails.logger.warn "Failed to render company logo in PDF: #{e.message}"
      end
      left_y -= 75
    end

    # Company name
    company_name = org&.name || @user.company_name
    if company_name.present?
      fill_color BRAND_PRIMARY
      font_size 14
      text_box company_name,
               at: [ 0, left_y ],
               width: 300,
               height: 20,
               align: :left,
               style: :bold
      left_y -= 18
    end

    # NIP
    if org&.nip.present?
      fill_color BRAND_SECONDARY
      font_size 9
      text_box "NIP: #{org.nip}",
               at: [ 0, left_y ],
               width: 300,
               height: 12,
               align: :left
      left_y -= 12
    end

    # Phone
    if org&.phone.present?
      fill_color BRAND_SECONDARY
      font_size 9
      text_box "Tel: #{org.phone}",
               at: [ 0, left_y ],
               width: 300,
               height: 12,
               align: :left
      left_y -= 12
    end

    # Company info (formatted text)
    company_info_height = 0
    if org&.company_info.present?
      left_y -= 4
      company_info_height = render_formatted_text(org.company_info, at: [ 0, left_y ], width: 350)
      left_y -= company_info_height
    end

    # Calculate actual header height from content rendered
    header_height = header_start_y - left_y + 15  # +15 for padding

    # Move cursor down past the header
    move_down header_height

    # Thin separator line
    stroke_color BRAND_BORDER
    line_width 0.5
    stroke_horizontal_line 0, CONTENT_WIDTH, at: cursor

    move_down 15
  end

  # Convert HTML from rich text editor to Prawn-compatible format and render
  # Returns the height used by the content (for header_height calculation)
  def render_formatted_text(html, at:, width:)
    return 0 if html.blank?

    prawn_text = html.dup

    # 1. Convert <font color="#hex"> to <color rgb="hex"> (execCommand generates this)
    prawn_text.gsub!(/<font[^>]*color=["']#?([0-9a-fA-F]{6})["'][^>]*>/i, '<color rgb="\1">')
    prawn_text.gsub!(/<\/font>/i, "</color>")

    # 2. Convert <span style="font-size: Xpx"> to <font size="Y">
    prawn_text.gsub!(/<span[^>]*style=["'][^"']*font-size:\s*10px[^"']*["'][^>]*>/i, '<font size="8">')
    prawn_text.gsub!(/<span[^>]*style=["'][^"']*font-size:\s*12px[^"']*["'][^>]*>/i, '<font size="9">')
    prawn_text.gsub!(/<span[^>]*style=["'][^"']*font-size:\s*14px[^"']*["'][^>]*>/i, '<font size="10">')
    prawn_text.gsub!(/<\/span>/i, "</font>")

    # 3. Convert block elements to newlines
    prawn_text.gsub!(/<div>/i, "")
    prawn_text.gsub!(/<\/div>/i, "\n")
    prawn_text.gsub!(/<br\s*\/?>/i, "\n")
    prawn_text.gsub!(/<p>/i, "")
    prawn_text.gsub!(/<\/p>/i, "\n")

    # 4. Strip any remaining unrecognized tags but keep their content
    prawn_text.gsub!(/<(?!\/?(?:b|i|color|font)\b)[^>]*>/i, "")

    # 5. Clean up consecutive/empty closing tags
    prawn_text.gsub!(/<\/font>\s*<\/font>/i, "</font>")
    prawn_text.gsub!(/<\/color>\s*<\/color>/i, "</color>")

    # 6. Trim trailing newlines
    prawn_text.strip!

    # Calculate height based on content
    line_count = prawn_text.count("\n") + 1
    line_height = 11  # font_size 8 + spacing
    content_height = [ line_count * line_height, 120 ].min  # max 120pt (~10 lines)

    font_size 8
    fill_color BRAND_SECONDARY
    text_box prawn_text,
             at: at,
             width: width,
             height: content_height,
             align: :left,
             inline_format: true,
             overflow: :truncate

    content_height
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

    move_down 8

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

    # Check if we need a new page (minimum space for header + at least one row)
    start_new_page if cursor < 80

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

    move_down 12
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
    # Pre-fetch all thumbnails to avoid multiple HTTP requests during table rendering
    thumbnails = prefetch_thumbnails(items)

    table_data = []

    # Header row with thumbnail column
    table_data << [
      { content: "", font_style: :bold },  # Thumbnail column
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

      # Thumbnail cell
      thumbnail_cell = thumbnails[item.id] || { content: "" }

      # Name cell with optional link
      # Note: Using same color as text (not blue) because multi-line links
      # create separate link rectangles per line which looks odd in some PDF viewers
      name_cell = if item.external_url.present?
        { content: "<link href='#{item.external_url}'>#{escape_html(item_name)}</link>", inline_format: true }
      else
        { content: item_name }
      end

      table_data << [
        thumbnail_cell,
        name_cell,
        { content: "#{item.quantity} #{item.unit_type_label}" },
        { content: format_currency(item.unit_price) },
        { content: format_currency(item.total_price), font_style: :bold }
      ]
    end

    # Compact table with thumbnail column
    table(table_data, width: CONTENT_WIDTH, cell_style: { size: 7.5, padding: [ 3, 5 ] }) do |t|
      # Header styling
      t.row(0).background_color = BRAND_LIGHT
      t.row(0).text_color = BRAND_PRIMARY
      t.row(0).size = 7

      # All cells - thin borders
      t.cells.borders = [ :bottom ]
      t.cells.border_color = BRAND_BORDER
      t.cells.border_width = 0.25

      # Column widths - with thumbnail column
      t.column(0).width = 35   # Thumbnail
      t.column(1).width = 260  # Nazwa
      t.column(2).width = 55   # Ilość
      t.column(3).width = 85   # Cena
      t.column(4).width = 100  # Suma

      # Alignments
      t.column(0).align = :center
      t.column(2).align = :center
      t.column(3).align = :right
      t.column(4).align = :right

      # Last row no bottom border
      t.row(-1).borders = []
    end

    move_down 4
  end

  def prefetch_thumbnails(items)
    thumbnails = {}

    items.each do |item|
      next unless item.thumbnail_url.present?

      begin
        image_data = download_image(item.thumbnail_url)
        next unless image_data

        # Optimize: resize to max 150px and convert to JPEG
        optimized_data = optimize_image(image_data, max_size: THUMBNAIL_MAX_SIZE)
        next unless optimized_data

        # Validate optimized image is supported by Prawn
        image_io = StringIO.new(optimized_data)
        if prawn_compatible_image?(image_io)
          image_io.rewind
          thumbnails[item.id] = { image: image_io, fit: [ 30, 30 ] }
        end
      rescue StandardError => e
        Rails.logger.warn "Failed to fetch thumbnail for item #{item.id}: #{e.message}"
      end
    end

    thumbnails
  end

  # Check if image can be rendered by Prawn (catches interlaced PNGs, etc.)
  def prawn_compatible_image?(image_io)
    document.send(:build_image_object, image_io)
    true
  rescue Prawn::Errors::UnsupportedImageType => e
    Rails.logger.warn "Skipping unsupported image: #{e.message}"
    false
  end

  def escape_html(text)
    text.to_s.gsub("&", "&amp;").gsub("<", "&lt;").gsub(">", "&gt;")
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
             at: [ CONTENT_WIDTH - 150, cursor ],
             width: 50,
             height: 12,
             align: :right

    fill_color BRAND_PRIMARY
    text_box format_currency(subtotal),
             at: [ CONTENT_WIDTH - 95, cursor ],
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
             at: [ CONTENT_WIDTH - 250, cursor ],
             width: 120,
             height: 15,
             align: :right

    font_size 12
    fill_color BRAND_PRIMARY
    text_box format_currency(@project.total_price),
             at: [ CONTENT_WIDTH - 125, cursor ],
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
        bounding_box([ PAGE_MARGIN_SIDES, FOOTER_Y_POSITION + 20 ], width: CONTENT_WIDTH, height: 25) do
          # Thin separator line
          stroke_color BRAND_BORDER
          line_width 0.5
          stroke_horizontal_line 0, CONTENT_WIDTH, at: cursor

          move_down 6

          # Left side - SAIVED logo + slogan
          logo_size = 12
          if File.exist?(logo_path)
            image logo_path, at: [ 0, cursor ], width: logo_size, height: logo_size
          end

          fill_color BRAND_PRIMARY
          font_size 7
          draw_text "SAIVED", at: [ logo_size + 3, cursor - 4 ], style: :bold

          fill_color BRAND_SECONDARY
          font_size 5
          draw_text "DESIGN MORE. MANAGE LESS.", at: [ logo_size + 3, cursor - 11 ]

          # Right side - page number
          font_size 6.5
          fill_color BRAND_SECONDARY
          text_box "Strona #{page_number} / #{page_count}",
                   at: [ CONTENT_WIDTH - 80, cursor ],
                   width: 80,
                   height: 10,
                   align: :right
        end
      end
    end
  end
end
