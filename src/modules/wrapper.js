import { setStyle } from '../utils'

export default {
  init(instance) {
    this.el = document.createElement('div')
    this.instance = instance
    this.instance.parent.appendChild(this.el)
    this.el.appendChild(this.instance.target.el)

    setStyle(this.el, {
      position: 'fixed',
      zIndex: instance.options.zIndex + 1,
      top: '50%',
      left: '50%',
      width: 0,
      height: 0
    })
  },

  destroy() {
    this.instance.parent.appendChild(this.instance.target.el)
    this.instance.parent.removeChild(this.el)
  }
}
