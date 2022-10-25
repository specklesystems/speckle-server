import { Vector2 } from 'three'
import { ViewerEvent } from '../../IViewer'
import EventEmitter from '../EventEmitter'

export interface InputOptions {
  hover: boolean
}

export const InputOptionsDefault = {
  hover: false
}

export default class Input extends EventEmitter {
  private tapTimeout
  private lastTap = 0
  private touchLocation: Touch
  private container

  constructor(container: HTMLElement, _options: InputOptions) {
    super()
    _options
    this.container = container

    // Handle mouseclicks
    let mdTime
    this.container.addEventListener('pointerdown', (e) => {
      e.preventDefault()
      mdTime = new Date().getTime()
    })

    this.container.addEventListener('pointerup', (e) => {
      e.preventDefault()
      const delta = new Date().getTime() - mdTime

      if (delta > 250) return

      const loc = this._getNormalisedClickPosition(e)

      if (e.shiftKey) (loc as unknown as Record<string, unknown>).multiSelect = true
      if (e.ctrlKey) this.emit('object-clicked-debug', loc)
      else this.emit(ViewerEvent.ObjectClicked, loc)
    })

    // Doubleclicks on touch devices
    // http://jsfiddle.net/brettwp/J4djY/
    this.container.addEventListener('touchstart', (e) => {
      this.touchLocation = e.targetTouches[0]
    })
    this.container.addEventListener('touchend', (e) => {
      // Ignore the first `touchend` when pinch-zooming (so we don't consider double-tap)
      if (e.targetTouches.length > 0) {
        return
      }
      const currentTime = new Date().getTime()
      const tapLength = currentTime - this.lastTap
      clearTimeout(this.tapTimeout)
      if (tapLength < 500 && tapLength > 0) {
        this.emit(
          ViewerEvent.ObjectDoubleClicked,
          this._getNormalisedClickPosition(this.touchLocation)
        )
      } else {
        this.tapTimeout = setTimeout(function () {
          clearTimeout(this.tapTimeout)
        }, 500)
      }
      this.lastTap = currentTime
    })

    this.container.addEventListener('dblclick', (e) => {
      this.emit(ViewerEvent.ObjectDoubleClicked, this._getNormalisedClickPosition(e))
    })

    // Handle multiple object selection
    // document.addEventListener('keydown', (e) => {
    //   if (e.isComposing || e.keyCode === 229) return
    //   if (e.key === 'Shift') this.multiSelect = true
    // })

    // document.addEventListener('keyup', (e) => {
    //   if (e.isComposing || e.keyCode === 229) return
    //   if (e.key === 'Shift') this.multiSelect = false
    // })
  }

  _getNormalisedClickPosition(e) {
    // Reference: https://threejsfundamentals.org/threejs/lessons/threejs-picking.html
    const canvas = this.container
    const rect = this.container.getBoundingClientRect()

    const pos = {
      x: ((e.clientX - rect.left) * canvas.width) / rect.width,
      y: ((e.clientY - rect.top) * canvas.height) / rect.height
    }
    const v = new Vector2(
      (pos.x / canvas.width) * 2 - 1,
      (pos.y / canvas.height) * -2 + 1
    )
    // console.warn(v)
    return v
  }

  dispose() {
    super.dispose()
  }
}
