import {
  CameraController,
  ExtendedIntersection,
  InputEvent,
  IViewer,
  NodeRenderView,
  ObjectLayers,
  SelectionEvent,
  SelectionExtension,
  TreeNode
} from '@speckle/viewer'
import { Material, OrthographicCamera, PerspectiveCamera, Vector2 } from 'three'

export class BlockSelectionExtension extends SelectionExtension {
  protected topLevelBlock: TreeNode | undefined = undefined

  constructor(viewer: IViewer, protected cameraProvider: CameraController) {
    super(viewer, cameraProvider)

    this.viewer.getRenderer().input.on(InputEvent.Click, this.onClick.bind(this))
  }

  protected onObjectClicked(selection: SelectionEvent | null) {}

  protected onObjectDoubleClick(selectionInfo: SelectionEvent | null) {}

  protected isBlock(node: TreeNode) {
    if (
      this.viewer.getWorldTree().isRoot(node) ||
      this.viewer.getWorldTree().isSubtreeRoot(node)
    )
      return false

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
    return node.model.raw.speckle_type.includes('InstanceProxy')
  }

  protected onClick(
    arg: Vector2 & {
      event: PointerEvent
      multiSelect: boolean
    }
  ) {
    const renderer = this.viewer.getRenderer()
    const result: ExtendedIntersection[] =
      renderer.intersections.intersect(
        renderer.scene,
        renderer.renderingCamera as PerspectiveCamera | OrthographicCamera,
        arg,
        ObjectLayers.STREAM_CONTENT_MESH,
        true,
        renderer.clippingVolume
      ) || []

    if (!result.length) return

    const first: [NodeRenderView, Material] = renderer.renderViewFromIntersection(
      result[0]
    )
    const rv = first[0]
    const material = first[1]

    const hitId = rv.renderData.id
    const subtreeId = rv.renderData.subtreeId
    const hitNodes = this.viewer.getWorldTree().findId(hitId, subtreeId)
    if (!hitNodes) return

    const hitNode = hitNodes[0]
    const chain = this.viewer.getWorldTree().getAncestors(hitNode)

    let selectNode = null
    if (!this.topLevelBlock) {
      this.topLevelBlock = chain.findLast((value: TreeNode) => this.isBlock(value))
      selectNode = this.topLevelBlock
    }

    if (selectNode)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
      this.selectObjects([selectNode.model.id])
    else this.clearSelection()

    // const hitNode = hitNodes[0]
    // let parentNode = hitNode
    // // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    // while (!parentNode.model.atomic && parentNode.parent) {
    //   // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    //   parentNode = parentNode.parent
    // }
    // console.log(parentNode)
  }
}
