import { setStyle } from '../utils'

export default {
  init(instance) {
    this.el = document.createElement('div')
    this.el.addEventListener('click', () => this.instance.close())
    this.instance = instance

    setStyle(this.el, {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      opacity: 0
    })

    this.updateStyle(instance.options)
  },

  updateStyle(options) {
    setStyle(this.el, {
      zIndex: options.zIndex,
      backgroundColor: options.bgColor,
      transition: `opacity
        ${options.transitionDuration}s
        ${options.transitionTimingFunction}`
    })
  },

  create() {
    this.instance.parent.appendChild(this.el)
  },

  destroy() {
    this.instance.parent.removeChild(this.el)
  },

  show() {
    setTimeout(
      () => this.el.style.opacity = this.instance.options.bgOpacity,
      30
    )
  },

  hide() {
    this.el.style.opacity = 0
  }
}
