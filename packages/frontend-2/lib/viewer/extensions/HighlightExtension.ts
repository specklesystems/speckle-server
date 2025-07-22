import {
  type TreeNode,
  type CameraController,
  SelectionExtension,
  type SelectionExtensionOptions,
  type SelectionEvent,
  type IViewer,
  StencilOutlineType
} from '@speckle/viewer'
import type { Vector2 } from 'three'
import { MathUtils } from 'three'

/**
 * Copied from LegacyViewer implementation.
 */
export class HighlightExtension extends SelectionExtension {
  constructor(viewer: IViewer, protected cameraProvider: CameraController) {
    super(viewer, cameraProvider)

    const highlightMaterial: SelectionExtensionOptions = {
      selectionMaterialData: {
        id: MathUtils.generateUUID(),
        color: 0x04cbfb,
        emissive: 0x0,
        opacity: 1,
        roughness: 1,
        metalness: 0,
        vertexColors: false,
        lineWeight: 1,
        stencilOutlines: StencilOutlineType.OVERLAY,
        pointSize: 4
      }
    }
    this.options = highlightMaterial
  }

  /** Remove highlight for provided ids only */
  public unselectObjects(ids: string[]) {
    if (!this._enabled || !this.selectedNodes.length) return

    const nodes: TreeNode[] = []
    for (const id of ids) {
      const found = this.viewer.getWorldTree().findId(id)
      if (found) nodes.push(...found)
    }
    this.clearSelection(nodes.filter((n) => this.selectedNodes.includes(n)))
  }

  // Disable built-in picking behaviour
  protected onObjectClicked(_sel: SelectionEvent) {}
  protected onObjectDoubleClick(_sel: SelectionEvent) {}
  protected onPointerMove(_e: Vector2) {}
}
