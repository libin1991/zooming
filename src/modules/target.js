import { cursor, setStyle, getOriginalSource, transformCssProp } from '../utils'

export default {
  init(el, instance) {
    this.el = el
    this.instance = instance
    this.wrapper = document.createElement('div')
    this.srcThumbnail = this.el.getAttribute('src')
    this.srcOriginal = getOriginalSource(this.el)
    this.rect = el.getBoundingClientRect()
    this.translate = calculateTranslate(this.rect)
    this.styleClose = setStyle(
      this.el,
      {
        position: 'absolute',
        top: 0,
        left: 0,
        right: '',
        bottom: '',
        whiteSpace: 'nowrap',
        marginTop: -this.rect.height / 2 + 'px',
        marginLeft: -this.rect.width / 2 + 'px',
        cursor: instance.options.enableGrab ? cursor.grab : cursor.zoomOut,
        transform: `translate(${this.translate.x}px, ${this.translate.y}px)`,
        transition: '',
        width: `${this.rect.width}px`,
        height: `${this.rect.height}px`
      },
      true
    )
  },

  zoomIn() {
    const options = this.instance.options

    this.scale = calculateScale(
      this.rect,
      options.scaleBase,
      options.customSize
    )

    // force layout update
    this.el.offsetWidth

    this.styleOpen = {
      transition: `${transformCssProp}
        ${options.transitionDuration}s
        ${options.transitionTimingFunction}`,
      transform: `scale(${this.scale.x},${this.scale.y})`
    }

    // trigger transition
    setStyle(this.el, this.styleOpen)
  },

  zoomOut() {
    // force layout update
    this.el.offsetWidth
    const rect = this.instance.placeholder.getBoundingClientRect()
    const translate = calculateTranslate(rect)

    setStyle(this.el, {
      transform: `translate(${translate.x}px, ${translate.y}px)`
    })
  },

  grab(x, y, scaleExtra) {
    const windowCenter = getWindowCenter()
    const [dx, dy] = [windowCenter.x - x, windowCenter.y - y]

    setStyle(this.el, {
      cursor: cursor.move,
      transform: `translate(
        ${this.translate.x + dx}px, ${this.translate.y + dy}px)
        scale(${this.scale.x + scaleExtra},${this.scale.y + scaleExtra})`
    })
  },

  move(x, y, scaleExtra) {
    const windowCenter = getWindowCenter()
    const [dx, dy] = [windowCenter.x - x, windowCenter.y - y]

    setStyle(this.el, {
      transition: transformCssProp,
      transform: `translate(
        ${this.translate.x + dx}px, ${this.translate.y + dy}px)
        scale(${this.scale.x + scaleExtra},${this.scale.y + scaleExtra})`
    })
  },

  restoreCloseStyle() {
    setStyle(this.el, this.styleClose)
  },

  restoreOpenStyle() {
    setStyle(this.el, this.styleOpen)
  },

  upgradeSource() {
    if (!this.srcOriginal) return

    const parentNode = this.el.parentNode
    const temp = this.el.cloneNode(false)

    // force compute the hi-res image in DOM to prevent
    // image flickering while updating src
    temp.setAttribute('src', this.srcOriginal)
    temp.style.position = 'fixed'
    temp.style.visibility = 'hidden'
    parentNode.appendChild(temp)

    setTimeout(() => {
      this.el.setAttribute('src', this.srcOriginal)
      parentNode.removeChild(temp)
    }, 100)
  },

  downgradeSource() {
    if (!this.srcOriginal) return

    this.el.setAttribute('src', this.srcThumbnail)
  }
}

function calculateTranslate(rect) {
  return {
    x: rect.left - (window.innerWidth - rect.width) / 2,
    y: rect.top - (window.innerHeight - rect.height) / 2
  }
}

function calculateScale(rect, scaleBase, customSize) {
  if (customSize) {
    return {
      x: customSize.width / rect.width,
      y: customSize.height / rect.height
    }
  } else {
    const targetHalfWidth = rect.width / 2
    const targetHalfHeight = rect.height / 2
    const windowCenter = getWindowCenter()

    // The distance between target edge and window edge
    const targetEdgeToWindowEdge = {
      x: windowCenter.x - targetHalfWidth,
      y: windowCenter.y - targetHalfHeight
    }

    const scaleHorizontally = targetEdgeToWindowEdge.x / targetHalfWidth
    const scaleVertically = targetEdgeToWindowEdge.y / targetHalfHeight

    // The additional scale is based on the smaller value of
    // scaling horizontally and scaling vertically
    const scale = scaleBase + Math.min(scaleHorizontally, scaleVertically)

    return {
      x: scale,
      y: scale
    }
  }
}

function getWindowCenter() {
  const windowWidth = Math.min(
    document.documentElement.clientWidth,
    window.innerWidth
  )
  const windowHeight = Math.min(
    document.documentElement.clientHeight,
    window.innerHeight
  )

  return {
    x: windowWidth / 2,
    y: windowHeight / 2
  }
}
