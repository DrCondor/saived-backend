import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["menu", "openIcon", "closeIcon"]

  connect() {
    this.closeOnClickOutside = this.closeOnClickOutside.bind(this)
    this.closeOnResize = this.closeOnResize.bind(this)
    window.addEventListener("resize", this.closeOnResize)
  }

  toggle() {
    if (this.menuTarget.classList.contains("hidden")) {
      this.open()
    } else {
      this.close()
    }
  }

  open() {
    this.menuTarget.classList.remove("hidden")
    if (this.hasOpenIconTarget) this.openIconTarget.classList.add("hidden")
    if (this.hasCloseIconTarget) this.closeIconTarget.classList.remove("hidden")
    document.addEventListener("click", this.closeOnClickOutside)
  }

  close() {
    this.menuTarget.classList.add("hidden")
    if (this.hasOpenIconTarget) this.openIconTarget.classList.remove("hidden")
    if (this.hasCloseIconTarget) this.closeIconTarget.classList.add("hidden")
    document.removeEventListener("click", this.closeOnClickOutside)
  }

  closeOnClickOutside(event) {
    if (!this.element.contains(event.target)) {
      this.close()
    }
  }

  closeOnResize() {
    // Close menu when resizing to desktop breakpoint
    if (window.innerWidth >= 768) {
      this.close()
    }
  }

  disconnect() {
    document.removeEventListener("click", this.closeOnClickOutside)
    window.removeEventListener("resize", this.closeOnResize)
  }
}
