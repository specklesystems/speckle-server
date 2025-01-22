import { IViewer } from '../../IViewer.js'
import { CameraController } from './CameraController.js'
type MoveType = 'forward' | 'back' | 'left' | 'right' | 'up' | 'down'

export class HybridCameraController extends CameraController {
  protected keyMap: Record<MoveType, boolean> = {
    forward: false,
    back: false,
    left: false,
    right: false,
    up: false,
    down: false
  }

  protected contextMenuTriggered = false

  public constructor(viewer: IViewer) {
    super(viewer)
    document.addEventListener('keydown', this.onKeyDown.bind(this))
    document.addEventListener('keyup', this.onKeyUp.bind(this))
    document.addEventListener('contextmenu', this.onContextMenu.bind(this))
  }

  public onEarlyUpdate(_delta?: number): void {
    super.onEarlyUpdate(_delta)
    /** We do this because sometimes while holding a kewy down you get an extra
     *  key down event **after** the context menu event, locking it in place
     */
    if (this.contextMenuTriggered) {
      this.cancelMove()
      this.contextMenuTriggered = false
    }
  }

  protected onKeyDown(event: KeyboardEvent) {
    switch (event.code) {
      case 'ArrowUp':
      case 'KeyW':
        this.keyMap.forward = true
        break

      case 'ArrowLeft':
      case 'KeyA':
        this.keyMap.left = true
        break

      case 'ArrowDown':
      case 'KeyS':
        this.keyMap.back = true
        break

      case 'ArrowRight':
      case 'KeyD':
        this.keyMap.right = true
        break

      case 'PageUp':
      case 'KeyQ':
        this.keyMap.up = true
        break

      case 'PageDown':
      case 'KeyE':
        this.keyMap.down = true
        break
    }
    if (
      !this._flyControls.enabled &&
      Object.values(this.keyMap).some((v) => v === true)
    )
      this.toggleControls()
  }

  protected onKeyUp(event: KeyboardEvent) {
    switch (event.code) {
      case 'ArrowUp':
      case 'KeyW':
        this.keyMap.forward = false
        break

      case 'ArrowLeft':
      case 'KeyA':
        this.keyMap.left = false
        break

      case 'ArrowDown':
      case 'KeyS':
        this.keyMap.back = false
        break

      case 'ArrowRight':
      case 'KeyD':
        this.keyMap.right = false
        break

      case 'PageUp':
      case 'KeyQ':
        this.keyMap.up = false
        break

      case 'PageDown':
      case 'KeyE':
        this.keyMap.down = false
        break
    }
    if (
      this._flyControls.enabled &&
      Object.values(this.keyMap).every((v) => v === false)
    )
      this.toggleControls()
  }

  protected onContextMenu() {
    this.contextMenuTriggered = true
  }

  protected cancelMove() {
    this.keyMap.back = false
    this.keyMap.forward = false
    this.keyMap.down = false
    this.keyMap.up = false
    this.keyMap.left = false
    this.keyMap.right = false
    if (
      this._flyControls.enabled &&
      Object.values(this.keyMap).every((v) => v === false)
    )
      this.toggleControls()
  }
}
