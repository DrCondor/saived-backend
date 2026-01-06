import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  toggle(event) {
    const index = event.currentTarget.dataset.index
    const content = document.querySelector(`[data-accordion-target="content${index}"]`)
    const icon = document.querySelector(`[data-accordion-target="icon${index}"]`)

    if (content && icon) {
      content.classList.toggle("hidden")
      icon.classList.toggle("rotate-180")
    }
  }
}
