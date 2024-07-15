import { clamp } from 'three/src/math/MathUtils.js'
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
  public constructor(viewer: IViewer) {
    super(viewer)
    document.addEventListener('keydown', this.onKeyDown.bind(this))
  }

  protected onKeyDown(event: KeyboardEvent) {
    let moveSpeed = this.options.moveSpeed ? this.options.moveSpeed : 1
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
      case 'KeyF':
        moveSpeed += 0.25
        moveSpeed = clamp(moveSpeed, 0.1, 5)
        this.options = { moveSpeed }
        break
      case 'KeyC':
        moveSpeed -= 0.25
        moveSpeed = clamp(moveSpeed, 0.1, 5)
        this.options = { moveSpeed }
        break
    }
    if (
      !this._controlsList[1].enabled &&
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
      this._controlsList[1].enabled &&
      Object.values(this.keyMap).every((v) => v === false)
    )
      this.toggleControls()
  }
}
