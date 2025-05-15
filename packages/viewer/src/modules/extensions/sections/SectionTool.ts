import { Box3, Plane } from 'three'
import { IViewer } from '../../../IViewer.js'
import { CameraController } from '../CameraController.js'
import { Extension } from '../Extension.js'
import { OBB } from 'three/examples/jsm/math/OBB.js'

export enum SectionToolEvent {
  DragStart = 'section-box-drag-start',
  DragEnd = 'section-box-drag-end',
  Updated = 'section-box-changed'
}

export interface SectionToolEventPayload {
  [SectionToolEvent.DragStart]: void
  [SectionToolEvent.DragEnd]: void
  [SectionToolEvent.Updated]: Plane[]
}

export class SectionTool extends Extension {
  public get inject() {
    return [CameraController]
  }

  constructor(viewer: IViewer, protected cameraProvider: CameraController) {
    super(viewer)
  }

  public get visible(): boolean {
    return false
  }
  public set visible(value: boolean) {
    value
  }

  public getBox(): Box3 | OBB {
    return new Box3()
  }
  public setBox(targetBox: Box3 | OBB, offset?: number): void {
    targetBox
    offset
  }

  public toggle(): void {
    this.enabled = !this._enabled
  }
}
