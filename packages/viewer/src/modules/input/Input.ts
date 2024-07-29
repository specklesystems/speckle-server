import { Vector2 } from 'three'
import EventEmitter from '../EventEmitter.js'

export enum InputEvent {
  PointerDown = 'pointer-down',
  PointerUp = 'pointer-up',
  PointerMove = 'pointer-move',
  PointerCancel = 'pointer-cancel',
  Wheel = 'wheel',
  Click = 'click',
  DoubleClick = 'double-click',
  KeyUp = 'key-up'
}

export interface InputEventPayload {
  [InputEvent.PointerDown]: Vector2 & { event: PointerEvent }
  [InputEvent.PointerUp]: Vector2 & { event: PointerEvent }
  [InputEvent.PointerMove]: Vector2 & { event: PointerEvent }
  [InputEvent.PointerCancel]: void
  [InputEvent.Wheel]: WheelEvent
  [InputEvent.Click]: Vector2 & { event: PointerEvent; multiSelect: boolean }
  [InputEvent.DoubleClick]: Vector2 & { event: PointerEvent; multiSelect: boolean }
  [InputEvent.KeyUp]: KeyboardEvent
}

//TO DO: Define proper interface for InputEvent data
export default class Input extends EventEmitter {
  private static readonly MAX_DOUBLE_CLICK_TIMING = 500
  private tapTimeout: number = 0
  private lastTap = 0
  private lastClick = 0
  private touchLocation: Touch | undefined
  private container

  constructor(container: HTMLElement) {
    super()
    this.container = container

    // Handle mouseclicks
    let mdTime: number
    this.container.addEventListener('pointerdown', (e) => {
      e.preventDefault()
      const loc = this._getNormalisedClickPosition(e)
      ;(loc as unknown as Record<string, unknown>).event = e
      mdTime = new Date().getTime()
      this.emit(InputEvent.PointerDown, loc)
    })

    this.container.addEventListener('pointerup', (e) => {
      e.preventDefault()
      const loc = this._getNormalisedClickPosition(e)
      ;(loc as unknown as Record<string, unknown>).event = e

      this.emit(InputEvent.PointerUp, loc)
      const now = new Date().getTime()
      const delta = now - mdTime
      const deltaClick = now - this.lastClick

      if (delta > 250 || deltaClick < Input.MAX_DOUBLE_CLICK_TIMING) return

      if (e.shiftKey) (loc as unknown as Record<string, unknown>).multiSelect = true
      this.emit(InputEvent.Click, loc)
      this.lastClick = new Date().getTime()
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
        if (this.touchLocation) {
          const loc = this._getNormalisedClickPosition(this.touchLocation)
          this.emit(InputEvent.DoubleClick, loc)
        }
      } else {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        this.tapTimeout = setTimeout(() => {
          clearTimeout(this.tapTimeout)
        }, 500)
      }
      this.lastTap = currentTime
    })

    this.container.addEventListener('dblclick', (e) => {
      const data = this._getNormalisedClickPosition(e)
      ;(data as unknown as Record<string, unknown>).event = e
      if (e.shiftKey) (data as unknown as Record<string, unknown>).multiSelect = true
      this.emit(InputEvent.DoubleClick, data)
    })

    this.container.addEventListener('pointermove', (e) => {
      const data = this._getNormalisedClickPosition(e)
      ;(data as unknown as Record<string, unknown>).event = e
      this.emit(InputEvent.PointerMove, data)
    })

    document.addEventListener('keyup', (e) => {
      this.emit(InputEvent.KeyUp, e)
    })

    document.addEventListener('wheel', (e) => {
      this.emit(InputEvent.Wheel, e)
    })

    document.addEventListener('pointercancel', (e) => {
      const loc = this._getNormalisedClickPosition(e)
      ;(loc as unknown as Record<string, unknown>).event = e

      this.emit(InputEvent.PointerUp, loc)
      this.emit(InputEvent.PointerCancel, loc)
    })
  }

  public on<T extends InputEvent>(
    eventType: T,
    listener: (arg: InputEventPayload[T]) => void
  ): void {
    super.on(eventType, listener)
  }

  _getNormalisedClickPosition(e: MouseEvent | Touch) {
    // Reference: https://threejsfundamentals.org/threejs/lessons/threejs-picking.html
    const canvas = this.container as HTMLCanvasElement
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
