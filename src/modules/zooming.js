import {
  cursor,
  loadImage,
  copy,
  transEndEvent,
  getOriginalSource
} from '../utils'
import DEFAULT_OPTIONS from '../options'

import EventHandler from './event-handler'
import Overlay from './overlay'
import Wrapper from './wrapper'
import Target from './target'

/**
 * Zooming instance.
 */
export default class Zooming {
  /**
   * @param {Object} [options] Update default options if provided.
   */
  constructor(options) {
    // elements
    this.parent = null
    this.placeholder = null
    this.wrapper = Object.create(Wrapper)
    this.target = Object.create(Target)
    this.overlay = Object.create(Overlay)
    this.eventHandler = Object.create(EventHandler)
    this.body = document.body

    // state
    this.shown = false
    this.lock = false
    this.released = true
    this.lastScrollPosition = null
    this.pressTimer = null

    // init
    this.options = Object.assign({}, DEFAULT_OPTIONS, options)
    this.eventHandler.init(this)
    this.listen(this.options.defaultZoomable)
  }

  /**
   * Make element(s) zoomable.
   * @param  {string|Element} el A css selector or an Element.
   * @return {this}
   */
  listen(el) {
    if (typeof el === 'string') {
      let els = document.querySelectorAll(el)
      let i = els.length

      while (i--) {
        this.listen(els[i])
      }

      return this
    }

    if (el.tagName !== 'IMG') return

    el.style.cursor = cursor.zoomIn
    el.addEventListener('click', this.eventHandler.click, { passive: false })

    if (this.options.preloadImage) {
      loadImage(getOriginalSource(el))
    }

    return this
  }

  /**
   * Update options.
   * @param  {Object} options An Object that contains this.options.
   * @return {this}
   */
  config(options) {
    if (!options) return this.options

    Object.assign(this.options, options)
    this.overlay.updateStyle(this.options)

    return this
  }

  /**
   * Open (zoom in) the Element.
   * @param  {Element} el The Element to open.
   * @param  {Function} [cb=this.options.onOpen] A callback function that will
   * be called when a target is opened and transition has ended. It will get
   * the target element as the argument.
   * @return {this}
   */
  open(el, cb = this.options.onOpen) {
    if (this.shown || this.lock) return

    const target = typeof el === 'string' ? document.querySelector(el) : el

    if (target.tagName !== 'IMG') return

    // onBeforeOpen event
    if (this.options.onBeforeOpen) this.options.onBeforeOpen(target)

    this.parent = target.parentNode.tagName === 'A'
      ? target.parentNode.parentNode
      : target.parentNode

    if (!this.options.preloadImage) {
      loadImage(this.target.srcOriginal)
    }

    this.shown = true
    this.lock = true

    this.placeholder = copy(target)
    this.target.init(target, this)
    this.overlay.init(this)

    this.parent.insertBefore(this.placeholder, target)
    this.wrapper.init(this)
    this.overlay.create()
    this.overlay.show()
    this.target.zoomIn()

    document.addEventListener('scroll', this.eventHandler.scroll)
    document.addEventListener('keydown', this.eventHandler.keydown)

    const onEnd = () => {
      target.removeEventListener(transEndEvent, onEnd)

      this.lock = false

      this.target.upgradeSource()

      if (this.options.enableGrab) {
        toggleGrabListeners(document, this.eventHandler, true)
      }

      if (cb) cb(target)
    }

    target.addEventListener(transEndEvent, onEnd)

    return this
  }

  /**
   * Close (zoom out) the Element currently opened.
   * @param  {Function} [cb=this.options.onClose] A callback function that will
   * be called when a target is closed and transition has ended. It will get
   * the target element as the argument.
   * @return {this}
   */
  close(cb = this.options.onClose) {
    if (!this.shown || this.lock) return

    const target = this.target.el

    // onBeforeClose event
    if (this.options.onBeforeClose) this.options.onBeforeClose(target)

    this.lock = true

    this.body.style.cursor = cursor.default
    this.overlay.hide()
    this.target.zoomOut()

    document.removeEventListener('scroll', this.eventHandler.scroll)
    document.removeEventListener('keydown', this.eventHandler.keydown)

    const onEnd = () => {
      target.removeEventListener(transEndEvent, onEnd)

      this.shown = false
      this.lock = false

      this.target.downgradeSource()

      if (this.options.enableGrab) {
        toggleGrabListeners(document, this.eventHandler, false)
      }

      this.target.restoreCloseStyle()
      this.parent.insertBefore(target, this.placeholder)
      this.parent.removeChild(this.placeholder)
      this.wrapper.destroy()
      this.overlay.destroy()

      if (cb) cb(target)
    }

    target.addEventListener(transEndEvent, onEnd)

    return this
  }

  /**
   * Grab the Element currently opened given a position and apply extra zoom-in.
   * @param  {number}   x The X-axis of where the press happened.
   * @param  {number}   y The Y-axis of where the press happened.
   * @param  {number}   scaleExtra Extra zoom-in to apply.
   * @param  {Function} [cb=this.options.scaleExtra] A callback function that
   * will be called when a target is grabbed and transition has ended. It
   * will get the target element as the argument.
   * @return {this}
   */
  grab(x, y, scaleExtra = this.options.scaleExtra, cb) {
    if (!this.shown || this.lock) return

    const target = this.target.el

    // onBeforeGrab event
    if (this.options.onBeforeGrab) this.options.onBeforeGrab(target)

    this.released = false
    this.target.grab(x, y, scaleExtra)

    const onEnd = () => {
      target.removeEventListener(transEndEvent, onEnd)
      if (cb) cb(target)
    }

    target.addEventListener(transEndEvent, onEnd)
  }

  /**
   * Move the Element currently grabbed given a position and apply extra zoom-in.
   * @param  {number}   x The X-axis of where the press happened.
   * @param  {number}   y The Y-axis of where the press happened.
   * @param  {number}   scaleExtra Extra zoom-in to apply.
   * @param  {Function} [cb=this.options.scaleExtra] A callback function that
   * will be called when a target is moved and transition has ended. It will
   * get the target element as the argument.
   * @return {this}
   */
  move(x, y, scaleExtra = this.options.scaleExtra, cb) {
    if (!this.shown || this.lock) return

    const target = this.target.el

    // onBeforeMove event
    if (this.options.onBeforeMove) this.options.onBeforeMove(target)

    this.released = false

    this.target.move(x, y, scaleExtra)
    this.body.style.cursor = cursor.move

    const onEnd = () => {
      target.removeEventListener(transEndEvent, onEnd)
      if (cb) cb(target)
    }

    target.addEventListener(transEndEvent, onEnd)
  }

  /**
   * Release the Element currently grabbed.
   * @param  {Function} [cb=this.options.onRelease] A callback function that
   * will be called when a target is released and transition has ended. It
   * will get the target element as the argument.
   * @return {this}
   */
  release(cb = this.options.onRelease) {
    if (!this.shown || this.lock) return

    const target = this.target.el

    // onBeforeRelease event
    if (this.options.onBeforeRelease) this.options.onBeforeRelease(target)

    this.lock = true

    this.target.restoreOpenStyle()
    this.body.style.cursor = cursor.default

    const onEnd = () => {
      target.removeEventListener(transEndEvent, onEnd)

      this.lock = false
      this.released = true

      if (cb) cb(target)
    }

    target.addEventListener(transEndEvent, onEnd)

    return this
  }
}

function toggleGrabListeners(el, handler, add) {
  const types = [
    'mousedown',
    'mousemove',
    'mouseup',
    'touchstart',
    'touchmove',
    'touchend'
  ]

  types.forEach(type => {
    if (add) {
      el.addEventListener(type, handler[type], { passive: false })
    } else {
      el.removeEventListener(type, handler[type], { passive: false })
    }
  })
}
