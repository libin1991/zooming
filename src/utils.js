export const webkitPrefix = 'WebkitAppearance' in document.documentElement.style
  ? '-webkit-'
  : ''

export const cursor = {
  default: 'auto',
  zoomIn: `${webkitPrefix}zoom-in`,
  zoomOut: `${webkitPrefix}zoom-out`,
  grab: `${webkitPrefix}grab`,
  move: 'move'
}

export function loadImage(src, cb) {
  if (!src) return

  const img = new Image()
  img.onload = function() {
    if (cb) cb(img)
  }

  img.src = src
}

export function getOriginalSource(el) {
  if (el.hasAttribute('data-original')) {
    return el.getAttribute('data-original')
  } else if (el.parentNode.tagName === 'A') {
    return el.parentNode.getAttribute('href')
  }

  return null
}

export function setStyle(el, styles, remember) {
  checkTrans(styles)

  let s = el.style
  let original = {}

  for (let key in styles) {
    if (remember) original[key] = s[key] || ''
    s[key] = styles[key]
  }

  return original
}

const stylesToCopy = [
  'position',
  'display',
  'float',
  'top',
  'left',
  'right',
  'bottom',
  'marginBottom',
  'marginLeft',
  'marginRight',
  'marginTop',
  'verticalAlign'
]

export function copy(el) {
  const box = el.getBoundingClientRect()
  const styles = getComputedStyle(el)
  const ph = document.createElement('div')
  let i = stylesToCopy.length, key

  while (i--) {
    key = stylesToCopy[i]
    ph.style[key] = styles[key]
  }

  setStyle(ph, {
    visibility: 'hidden',
    width: box.width + 'px',
    height: box.height + 'px',
    display: styles.display === 'inline' ? 'inline-block' : styles.display
  })

  return ph
}

export function bindAll(_this, that) {
  const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(_this))

  methods.forEach(method => {
    _this[method] = _this[method].bind(that)
  })
}

const trans = sniffTransition(document.createElement('div'))
export const transformCssProp = trans.transformCssProp
export const transEndEvent = trans.transEndEvent

function checkTrans(styles) {
  const transitionProp = trans.transitionProp
  const transformProp = trans.transformProp

  let value
  if (styles.transition) {
    value = styles.transition
    delete styles.transition
    styles[transitionProp] = value
  }
  if (styles.transform) {
    value = styles.transform
    delete styles.transform
    styles[transformProp] = value
  }
}

function sniffTransition(el) {
  let ret = {}
  const trans = ['webkitTransition', 'transition', 'mozTransition']
  const tform = ['webkitTransform', 'transform', 'mozTransform']
  const end = {
    transition: 'transitionend',
    mozTransition: 'transitionend',
    webkitTransition: 'webkitTransitionEnd'
  }

  trans.some(prop => {
    if (el.style[prop] !== undefined) {
      ret.transitionProp = prop
      ret.transEndEvent = end[prop]
      return true
    }
  })

  tform.some(prop => {
    if (el.style[prop] !== undefined) {
      ret.transformProp = prop
      ret.transformCssProp = prop.replace(/(.*)Transform/, '-$1-transform')
      return true
    }
  })

  return ret
}
