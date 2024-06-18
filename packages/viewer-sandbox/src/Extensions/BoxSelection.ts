/* eslint-disable @typescript-eslint/ban-ts-comment */
import { InputEvent } from '@speckle/viewer'
import { ObjectLayers } from '@speckle/viewer'
import { NodeRenderView } from '@speckle/viewer'
import { SelectionExtension } from '@speckle/viewer'
import { BatchObject } from '@speckle/viewer'
import { Extension, IViewer, GeometryType, CameraController } from '@speckle/viewer'
import {
  Matrix4,
  ShaderMaterial,
  BufferGeometry,
  BufferAttribute,
  Mesh,
  Vector2,
  Vector3,
  Box3,
  Vector4
} from 'three'

export class BoxSelection extends Extension {
  get inject() {
    return [CameraController]
  }

  private selectionExtension: SelectionExtension
  private dragBoxMaterial!: ShaderMaterial

  private dragging = false
  private frameLock = false

  private idsToSelect: Array<string> | null = []

  get enabled(): boolean {
    return this._enabled
  }
  set enabled(value: boolean) {
    this._enabled = value
  }

  public constructor(viewer: IViewer, private cameraController: CameraController) {
    super(viewer)
    /** Get the SelectionExtension. We'll need it to remotely enable/disable it */
    //@ts-ignore
    this.selectionExtension = this.viewer.getExtension(SelectionExtension)

    /** Create the drag box */
    this.makeNDCBox()

    /** Attach to input events */
    viewer.getRenderer().input.on(InputEvent.PointerDown, this.onPointerDown.bind(this))
    viewer.getRenderer().input.on(InputEvent.PointerUp, this.onPointerUp.bind(this))
    viewer.getRenderer().input.on(InputEvent.PointerMove, this.onPointerMove.bind(this))
  }

  public onEarlyUpdate() {
    if (this.idsToSelect) {
      /** Send the ids to the selection extension to be selected */
      this.selectionExtension.clearSelection()
      this.selectionExtension.selectObjects(this.idsToSelect, true)
      this.idsToSelect = null
      this.viewer.requestRender()
    }
    this.frameLock = false
  }
  private onPointerDown(e: Vector2 & { event: PointerEvent }) {
    if (e.event.altKey) {
      /** Disable camera controller. We want to be able to drag the selection box */
      this.cameraController.enabled = false
      this.dragging = true
      /** Copy pointer's starting point */
      this.ndcFrom.copy(e)
    }
  }

  private onPointerUp() {
    /** Re-enable the camera controller */
    this.cameraController.enabled = true
    /** Hide the selection box */
    this.dragBoxMaterial.uniforms.transform.value = new Matrix4().makeScale(0, 0, 0)
    this.dragBoxMaterial.needsUpdate = true

    this.dragging = false
    this.viewer.requestRender()
  }

  private onPointerMove(e: Vector2 & { event: PointerEvent }) {
    /** Selection box only when holding the alt key */
    if (!e.event.altKey || !this.dragging || this.frameLock) return
    /** Copy the current point */
    this.ndcTo.copy(e)
    /** Coompute transform */
    const ndcTransform = this.getNDCTransform(this.ndcFrom, this.ndcTo)

    /** Update the selection box visual */
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    this.dragBoxMaterial.uniforms.transform.value.copy(ndcTransform)
    this.dragBoxMaterial.needsUpdate = true

    /** Compute the final selection box in NDC */
    this.ndcBox.min.set(-1, -1, 0)
    this.ndcBox.max.set(1, 1, 0)
    this.ndcBox.applyMatrix4(ndcTransform)

    /** Get the ids of objects that fall withing the selection box */
    this.idsToSelect = this.getSelectionIds(this.ndcBox)
    this.frameLock = true
  }

  /** Gets the object ids that fall withing the provided selection box */
  private getSelectionIds(selectionBox: Box3) {
    /** Get the renderer */
    const renderer = this.viewer.getRenderer()
    /** Get the mesh batches */
    const batches = renderer.batcher.getBatches(undefined, GeometryType.MESH)
    /** Compute the clip matrix */
    const clipMatrix = new Matrix4()
    if (renderer.renderingCamera) {
      clipMatrix.multiplyMatrices(
        renderer.renderingCamera.projectionMatrix,
        renderer.renderingCamera.matrixWorldInverse
      )
    }

    /** We're using three-mesh-bvh library for out BVH
     *  Go over each batch and test it against the TAS only.
     **/
    const selectionRvs: Array<NodeRenderView> = []
    for (let b = 0; b < batches.length; b++) {
      batches[b].mesh.TAS.shapecast({
        /** This is the callback from the TAS's bounds internal nodes */
        intersectsTAS: (box: Box3) => {
          /** We continue traversion only if the selection box intersects an internal node */
          const ndcBox = this.worldBoxToNDC(box, clipMatrix)
          const ret = selectionBox.intersectsBox(ndcBox)
          return ret
        },
        /** This is the callback from the TAS box leaf nodes */
        intersectTASRange: (batchObject: BatchObject) => {
          const objectBox = batchObject.aabb
          const ndcBox = this.worldBoxToNDC(objectBox, clipMatrix)
          /** We consider an object selected only it's NDC AABB is contained in the selection box */
          if (selectionBox.containsBox(ndcBox))
            selectionRvs.push(batchObject.renderView)
          return false
        },
        /** This is the callback from the BAS bounds internal nodes */
        intersectsBounds: () => {
          return false
        },
        /** This is the callback from the BAS triangle leaf nodes */
        intersectsTriangle: () => {
          return false
        }
      })
    }
    return selectionRvs.map((rv: NodeRenderView) => rv.renderData.id)
  }

  /** Buffers for reading/writing */
  private ndcFrom: Vector2 = new Vector2()
  private ndcTo: Vector2 = new Vector2()
  private ndcBox: Box3 = new Box3()
  private ndcBoxSize: Vector3 = new Vector3()

  /** Gets the mat4 required to transform a full screen quad to a box defined by a min and a max */
  private getNDCTransform(ndcFrom: Vector2, ndcTo: Vector2): Matrix4 {
    /** Get thereal min/max */
    const xmin = Math.min(ndcFrom.x, ndcTo.x)
    const xmax = Math.max(ndcFrom.x, ndcTo.x)
    const ymin = Math.min(ndcFrom.y, ndcTo.y)
    const ymax = Math.max(ndcFrom.y, ndcTo.y)
    this.ndcBox.min.set(xmin, ymin, 0)
    this.ndcBox.max.set(xmax, ymax, 0)
    /** Get the size */
    const scale = this.ndcBox.getSize(this.ndcBoxSize)

    /** Compute the transformation */
    return new Matrix4()
      .makeTranslation(
        ndcFrom.x + (ndcTo.x - ndcFrom.x) * 0.5,
        ndcFrom.y + (ndcTo.y - ndcFrom.y) * 0.5,
        0
      )
      .multiply(new Matrix4().makeScale(scale.x * 0.5, scale.y * 0.5, 1))
  }

  /** Creates the drag box as a three.js mesh */
  private makeNDCBox() {
    /** Geometry will be a full screen NDC quad */
    const quadGeometry = new BufferGeometry()
    quadGeometry.setAttribute(
      'position',
      new BufferAttribute(
        new Float32Array([
          -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0,
          -1.0, -1.0, 1.0
        ]),
        3
      )
    )

    /** We'll be changing/scaling the quad as we drag the mouse using a single mat4*/
    this.dragBoxMaterial = new ShaderMaterial({
      uniforms: {
        transform: { value: new Matrix4().makeScale(0, 0, 0) },
        color: {
          value: new Vector4(
            0.01568627450980392,
            0.49411764705882355,
            0.984313725490196,
            0.25
          )
        }
      },
      vertexShader: `
      uniform mat4 transform;

			void main()	{
				gl_Position = transform * vec4( position, 1.0 );

			}
     `,
      fragmentShader: `
      uniform vec4 color;
      void main(){
        gl_FragColor = color;
      }

      `
    })
    this.dragBoxMaterial.transparent = true

    const quad = new Mesh(quadGeometry, this.dragBoxMaterial)
    /** The viewer needs objects to be part of a layer. We chose OVERLAY here */
    quad.layers.set(ObjectLayers.OVERLAY)
    /** Three.js doesn't know what we're doing here and it might cull the quad */
    quad.frustumCulled = false
    /** Just add it to the scene as any other three.js object */
    this.viewer.getRenderer().scene.add(quad)
  }

  /** Buffers for reading/writing */
  private WSBBBuffer: Array<Vector4> = [
    new Vector4(),
    new Vector4(),
    new Vector4(),
    new Vector4(),
    new Vector4(),
    new Vector4(),
    new Vector4(),
    new Vector4()
  ]
  private boxBuffer: Box3 = new Box3()

  /** Utiliy for getting a world space Box3 into an NDC axis aligned Box3 */
  private worldBoxToNDC(worldBox: Box3, clipMatrix: Matrix4): Box3 {
    this.WSBBBuffer[0].set(worldBox.max.x, worldBox.max.y, worldBox.max.z, 1.0)
    this.WSBBBuffer[1].set(worldBox.min.x, worldBox.max.y, worldBox.max.z, 1.0)
    this.WSBBBuffer[2].set(worldBox.min.x, worldBox.min.y, worldBox.max.z, 1.0)
    this.WSBBBuffer[3].set(worldBox.max.x, worldBox.min.y, worldBox.max.z, 1.0)
    this.WSBBBuffer[4].set(worldBox.max.x, worldBox.max.y, worldBox.min.z, 1.0)
    this.WSBBBuffer[5].set(worldBox.min.x, worldBox.max.y, worldBox.min.z, 1.0)
    this.WSBBBuffer[6].set(worldBox.min.x, worldBox.min.y, worldBox.min.z, 1.0)
    this.WSBBBuffer[7].set(worldBox.max.x, worldBox.min.y, worldBox.min.z, 1.0)

    this.WSBBBuffer[0].applyMatrix4(clipMatrix)
    this.WSBBBuffer[1].applyMatrix4(clipMatrix)
    this.WSBBBuffer[2].applyMatrix4(clipMatrix)
    this.WSBBBuffer[3].applyMatrix4(clipMatrix)
    this.WSBBBuffer[4].applyMatrix4(clipMatrix)
    this.WSBBBuffer[5].applyMatrix4(clipMatrix)
    this.WSBBBuffer[6].applyMatrix4(clipMatrix)
    this.WSBBBuffer[7].applyMatrix4(clipMatrix)

    this.WSBBBuffer[0].x = this.WSBBBuffer[0].x / this.WSBBBuffer[0].w
    this.WSBBBuffer[0].y = this.WSBBBuffer[0].y / this.WSBBBuffer[0].w
    this.WSBBBuffer[1].x = this.WSBBBuffer[1].x / this.WSBBBuffer[1].w
    this.WSBBBuffer[1].y = this.WSBBBuffer[1].y / this.WSBBBuffer[1].w
    this.WSBBBuffer[2].x = this.WSBBBuffer[2].x / this.WSBBBuffer[2].w
    this.WSBBBuffer[2].y = this.WSBBBuffer[2].y / this.WSBBBuffer[2].w
    this.WSBBBuffer[3].x = this.WSBBBuffer[3].x / this.WSBBBuffer[3].w
    this.WSBBBuffer[3].y = this.WSBBBuffer[3].y / this.WSBBBuffer[3].w
    this.WSBBBuffer[4].x = this.WSBBBuffer[4].x / this.WSBBBuffer[4].w
    this.WSBBBuffer[4].y = this.WSBBBuffer[4].y / this.WSBBBuffer[4].w
    this.WSBBBuffer[5].x = this.WSBBBuffer[5].x / this.WSBBBuffer[5].w
    this.WSBBBuffer[5].y = this.WSBBBuffer[5].y / this.WSBBBuffer[5].w
    this.WSBBBuffer[6].x = this.WSBBBuffer[6].x / this.WSBBBuffer[6].w
    this.WSBBBuffer[6].y = this.WSBBBuffer[6].y / this.WSBBBuffer[6].w
    this.WSBBBuffer[7].x = this.WSBBBuffer[7].x / this.WSBBBuffer[7].w
    this.WSBBBuffer[7].y = this.WSBBBuffer[7].y / this.WSBBBuffer[7].w

    const minX = Math.min(
      this.WSBBBuffer[0].x,
      this.WSBBBuffer[1].x,
      this.WSBBBuffer[2].x,
      this.WSBBBuffer[3].x,
      this.WSBBBuffer[4].x,
      this.WSBBBuffer[5].x,
      this.WSBBBuffer[6].x,
      this.WSBBBuffer[7].x
    )
    const minY = Math.min(
      this.WSBBBuffer[0].y,
      this.WSBBBuffer[1].y,
      this.WSBBBuffer[2].y,
      this.WSBBBuffer[3].y,
      this.WSBBBuffer[4].y,
      this.WSBBBuffer[5].y,
      this.WSBBBuffer[6].y,
      this.WSBBBuffer[7].y
    )
    const maxX = Math.max(
      this.WSBBBuffer[0].x,
      this.WSBBBuffer[1].x,
      this.WSBBBuffer[2].x,
      this.WSBBBuffer[3].x,
      this.WSBBBuffer[4].x,
      this.WSBBBuffer[5].x,
      this.WSBBBuffer[6].x,
      this.WSBBBuffer[7].x
    )
    const maxY = Math.max(
      this.WSBBBuffer[0].y,
      this.WSBBBuffer[1].y,
      this.WSBBBuffer[2].y,
      this.WSBBBuffer[3].y,
      this.WSBBBuffer[4].y,
      this.WSBBBuffer[5].y,
      this.WSBBBuffer[6].y,
      this.WSBBBuffer[7].y
    )

    this.boxBuffer.min.set(minX, minY, 0)
    this.boxBuffer.max.set(maxX, maxY, 0)
    return this.boxBuffer
  }
}
