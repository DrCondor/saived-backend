require "test_helper"

class ProjectPdfGeneratorTest < ActiveSupport::TestCase
  setup do
    @user = create(:user, first_name: "Anna", last_name: "Kowalska", company_name: "Studio Design")
    @project = create(:project, owner: @user, name: "Apartament Centrum")
    @project.project_memberships.create!(user: @user, role: "owner")
    @section = @project.sections.first
  end

  # ============================================================
  # BASIC FUNCTIONALITY
  # ============================================================

  test "generates valid PDF" do
    generator = ProjectPdfGenerator.new(@project, @user)
    generator.generate

    pdf_data = generator.to_pdf

    assert pdf_data.present?
    assert_kind_of String, pdf_data
    # PDF files start with %PDF
    assert pdf_data.start_with?("%PDF")
  end

  test "filename includes sanitized project name" do
    generator = ProjectPdfGenerator.new(@project, @user)

    filename = generator.filename

    assert filename.start_with?("kosztorys_Apartament_Centrum_")
    assert filename.end_with?(".pdf")
  end

  test "filename handles special characters in project name" do
    @project.update!(name: "Łazienka & Kuchnia/Salon")
    generator = ProjectPdfGenerator.new(@project, @user)

    filename = generator.filename

    # Special characters should be removed, Polish letters preserved
    assert_includes filename, "Łazienka"
    assert_includes filename, "KuchniaSalon"
    assert_not_includes filename, "&"
    assert_not_includes filename, "/"
  end

  test "filename includes document number" do
    generator = ProjectPdfGenerator.new(@project, @user)

    filename = generator.filename

    # Document number format: YEAR/project_id padded to 4 digits
    year = Time.current.year
    assert_includes filename, "#{year}-"
  end

  # ============================================================
  # ORGANIZATION DATA
  # ============================================================

  test "includes organization data when present" do
    org = create(:organization, :with_full_details, name: "Test Company")
    @user.update!(organization: org)

    generator = ProjectPdfGenerator.new(@project, @user)
    generator.generate
    pdf_data = generator.to_pdf

    # PDF should be generated without errors
    assert pdf_data.present?
    assert pdf_data.start_with?("%PDF")
  end

  test "includes company logo when organization has logo" do
    org = create(:organization, :with_logo, name: "Logo Company")
    @user.update!(organization: org)

    generator = ProjectPdfGenerator.new(@project, @user)

    # Should not raise any errors
    assert_nothing_raised do
      generator.generate
      pdf_data = generator.to_pdf
      assert pdf_data.present?
    end
  end

  test "handles user without organization" do
    assert_nil @user.organization

    generator = ProjectPdfGenerator.new(@project, @user)

    assert_nothing_raised do
      generator.generate
      pdf_data = generator.to_pdf
      assert pdf_data.present?
    end
  end

  # ============================================================
  # FORMAT HELPERS
  # ============================================================

  test "format_currency formats zero correctly" do
    generator = ProjectPdfGenerator.new(@project, @user)

    result = generator.send(:format_currency, 0)
    assert_equal "0,00 zł", result

    result = generator.send(:format_currency, nil)
    assert_equal "0,00 zł", result
  end

  test "format_currency formats small amounts correctly" do
    generator = ProjectPdfGenerator.new(@project, @user)

    result = generator.send(:format_currency, 123.45)
    assert_equal "123,45 zł", result
  end

  test "format_currency formats large amounts with spaces" do
    generator = ProjectPdfGenerator.new(@project, @user)

    result = generator.send(:format_currency, 1234567.89)
    assert_equal "1 234 567,89 zł", result
  end

  test "format_date formats date in Polish" do
    generator = ProjectPdfGenerator.new(@project, @user)

    # Test various months
    date = Date.new(2026, 1, 15)
    assert_equal "15 stycznia 2026", generator.send(:format_date, date)

    date = Date.new(2026, 5, 3)
    assert_equal "3 maja 2026", generator.send(:format_date, date)

    date = Date.new(2026, 12, 31)
    assert_equal "31 grudnia 2026", generator.send(:format_date, date)
  end

  # ============================================================
  # EDGE CASES
  # ============================================================

  test "handles project without sections" do
    @project.sections.destroy_all

    generator = ProjectPdfGenerator.new(@project, @user)

    assert_nothing_raised do
      generator.generate
      pdf_data = generator.to_pdf
      assert pdf_data.present?
    end
  end

  test "handles section without items" do
    @section.items.destroy_all

    generator = ProjectPdfGenerator.new(@project, @user)

    assert_nothing_raised do
      generator.generate
      pdf_data = generator.to_pdf
      assert pdf_data.present?
    end
  end

  test "handles items without thumbnails" do
    create(:project_item, project_section: @section, name: "Chair", thumbnail_url: nil)

    generator = ProjectPdfGenerator.new(@project, @user)

    assert_nothing_raised do
      generator.generate
      pdf_data = generator.to_pdf
      assert pdf_data.present?
    end
  end

  test "handles items with invalid thumbnail URLs gracefully" do
    create(:project_item, project_section: @section, name: "Chair", thumbnail_url: "https://invalid.example.com/404.jpg")

    generator = ProjectPdfGenerator.new(@project, @user)

    # Should not raise, should handle gracefully
    assert_nothing_raised do
      generator.generate
      pdf_data = generator.to_pdf
      assert pdf_data.present?
    end
  end

  test "handles project with description" do
    @project.update!(description: "Nowoczesny apartament w centrum miasta")

    generator = ProjectPdfGenerator.new(@project, @user)

    assert_nothing_raised do
      generator.generate
      pdf_data = generator.to_pdf
      assert pdf_data.present?
    end
  end

  test "handles items with notes" do
    create(:project_item, project_section: @section, name: "Chair", note: "Preferowany kolor: szary")

    generator = ProjectPdfGenerator.new(@project, @user)

    assert_nothing_raised do
      generator.generate
      pdf_data = generator.to_pdf
      assert pdf_data.present?
    end
  end

  test "handles items with external URLs" do
    create(:project_item, project_section: @section, name: "Chair", external_url: "https://ikea.pl/chair")

    generator = ProjectPdfGenerator.new(@project, @user)

    assert_nothing_raised do
      generator.generate
      pdf_data = generator.to_pdf
      assert pdf_data.present?
    end
  end

  test "handles items with proposal status" do
    create(:project_item, project_section: @section, name: "Chair", status: "Propozycja")

    generator = ProjectPdfGenerator.new(@project, @user)

    assert_nothing_raised do
      generator.generate
      pdf_data = generator.to_pdf
      assert pdf_data.present?
    end
  end

  # ============================================================
  # USER DISPLAY
  # ============================================================

  test "user_display_name returns full_name when present" do
    generator = ProjectPdfGenerator.new(@project, @user)

    assert_equal "Anna Kowalska", generator.send(:user_display_name)
  end

  test "user_display_name returns email when no name" do
    @user.update!(first_name: nil, last_name: nil)
    generator = ProjectPdfGenerator.new(@project, @user)

    assert_equal @user.email, generator.send(:user_display_name)
  end

  # ============================================================
  # MULTIPLE SECTIONS
  # ============================================================

  test "handles multiple sections with items" do
    # Create second section
    section2 = @project.sections.create!(name: "Sypialnia", position: 2)

    # Add items to both sections
    create(:project_item, project_section: @section, name: "Sofa", unit_price: 3000)
    create(:project_item, project_section: @section, name: "Stolik", unit_price: 800)
    create(:project_item, project_section: section2, name: "Łóżko", unit_price: 2500)

    generator = ProjectPdfGenerator.new(@project, @user)

    assert_nothing_raised do
      generator.generate
      pdf_data = generator.to_pdf
      assert pdf_data.present?
      assert pdf_data.start_with?("%PDF")
    end
  end

  # ============================================================
  # FORMATTED TEXT (company_info)
  # ============================================================

  test "renders formatted company_info with HTML tags" do
    org = create(:organization,
                 name: "Design Studio",
                 company_info: "<b>Bold text</b> and <i>italic</i>")
    @user.update!(organization: org)

    generator = ProjectPdfGenerator.new(@project, @user)

    assert_nothing_raised do
      generator.generate
      pdf_data = generator.to_pdf
      assert pdf_data.present?
    end
  end

  test "renders company_info with color spans" do
    org = create(:organization,
                 name: "Design Studio",
                 company_info: '<span style="color:#FF0000">Red text</span>')
    @user.update!(organization: org)

    generator = ProjectPdfGenerator.new(@project, @user)

    assert_nothing_raised do
      generator.generate
      pdf_data = generator.to_pdf
      assert pdf_data.present?
    end
  end
end
