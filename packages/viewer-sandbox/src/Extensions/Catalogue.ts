import {
  BatchObject,
  NodeRenderView,
  ObjectLayers,
  SpeckleText,
  SpeckleTextMaterial,
  Extension
} from '@speckle/viewer'
import potpack from 'potpack'
import {
  Box3Helper,
  Color,
  Matrix4,
  Vector3,
  Box3,
  DoubleSide,
  Group,
  Mesh
} from 'three'

const ZERO = 0.00001
const ONE = 0.99999
/** Simple animation data interface */
interface Animation {
  target: BatchObject
  start: Vector3
  end: Vector3
  current: Vector3
  radialEnd: Vector3
  time: number
}

interface Box {
  x: number
  y: number
  w: number
  h: number
}

interface ObjectBox extends Box {
  object: BatchObject
}

interface CategoryBox extends Box {
  category: string
  boxes: Array<ObjectBox>
}

export class Catalogue extends Extension {
  /** We'll store our animations here */
  private animations: Animation[] = []
  private textGroup: Group = new Group()
  private reverse = false
  /** We'll store the boxes for the categories here */

  /** Animation params */
  private readonly animTimeScale: number = 0.25

  /** We're tying in to the viewer core's frame event */
  public onLateUpdate(deltaTime: number) {
    if (!this.animations.length) return

    let animCount = 0
    for (let k = 0; k < this.animations.length; k++) {
      /** Animation finished, no need to update it */
      if (this.animations[k].time === 1 || this.animations[k].time === 0) {
        continue
      }
      /** Compute the next animation time value */
      const t =
        this.animations[k].time +
        (this.reverse
          ? -(deltaTime * this.animTimeScale)
          : deltaTime * this.animTimeScale)

      /** Clamp it to 1 */
      this.animations[k].time = Math.min(Math.max(t, 0), 1)
      /** Compute current position value based on animation time */
      const valueL = new Vector3().copy(this.animations[k].start).lerp(
        this.animations[k].end,
        this.easeOutQuart(this.animations[k].time) // Added easing
      )
      const valueR = new Vector3().copy(this.animations[k].start).lerp(
        this.animations[k].radialEnd,
        this.easeOutQuart(this.animations[k].time) // Added easing
      )
      const value = new Vector3().lerpVectors(
        valueR,
        valueL,
        this.easeOutQuart(this.animations[k].time)
      )
      /** Apply the translation */
      this.animations[k].target.transformTRS(value, undefined, undefined, undefined)
      animCount++
    }

    /** If any animations updated, request a render */
    if (animCount) {
      this.viewer.requestRender()
    }
  }

  public onRender() {
    // NOT IMPLEMENTED for this example
  }
  public onResize() {
    // NOT IMPLEMENTED for this example
  }

  public play() {
    this.reverse = false
    for (let k = 0; k < this.animations.length; k++) {
      this.animations[k].time = ZERO
    }
  }

  public playReverse() {
    for (let k = 0; k < this.animations.length; k++) {
      this.animations[k].time = ONE
    }
    this.reverse = true
  }

  public wipe() {
    this.animations = []
  }

  /** Example's main function */
  public async categorize(input: Array<{ ids: Array<string>; value: string }>) {
    if (this.animations.length) return

    const padding = 0.5
    const categoryPadding = 10
    const origin = new Vector3(0, 0, 0)

    const objectBoxes: { [id: string]: ObjectBox } = {}
    const categories: { [categoryName: string]: CategoryBox } = {}

    for (const cat of input) {
      const boxes: ObjectBox[] = []
      for (let k = 0; k < cat.ids.length; k++) {
        const nodes = this.viewer.getWorldTree().findId(cat.ids[k])
        if (!nodes) continue

        /** Just get the first node */
        const node = nodes[0]

        const rvs = this.viewer
          .getWorldTree()
          .getRenderTree()
          .getRenderViewsForNode(node)

        const objects: BatchObject[] = rvs
          .map((rv: NodeRenderView) => {
            return this.viewer.getRenderer().getObject(rv)
          })
          .filter((value: BatchObject | null) => {
            return value && !objectBoxes[value.renderView.renderData.id]
          }) as BatchObject[]

        objects.forEach((object: BatchObject) => {
          if (!object) return
          const aabbSize = object?.aabb.getSize(new Vector3())
          const box = {
            object,
            w: aabbSize.x + padding,
            h: aabbSize.y + padding,
            x: 0,
            y: 0
          }
          objectBoxes[object.renderView.renderData.id] = box
          boxes.push(box)
        })

        if (!objects.length) continue

        const { w, h } = potpack(boxes)
        categories[cat.value] = {
          category: cat.value,
          boxes,
          w: w + categoryPadding,
          h: h + categoryPadding,
          x: 0,
          y: 0
        }
      }
      potpack(Object.values(categories))
      console.log(categories)
    }

    for (const k in categories) {
      for (let i = 0; i < categories[k].boxes.length; i++) {
        const objectBox = categories[k].boxes[i]
        const box3 = new Box3(
          new Vector3(objectBox.x + origin.x, objectBox.y + origin.y, 0),
          new Vector3(
            objectBox.x + origin.x + objectBox.w,
            objectBox.y + origin.y + objectBox.h,
            0
          )
        ).applyMatrix4(
          new Matrix4().makeTranslation(categories[k].x, categories[k].y, 0)
        )

        const boxHelper = new Box3Helper(box3, new Color(0x047efb))
        /** Set the layers to PROPS, so that AO and interactions will ignore them */
        boxHelper.layers.set(ObjectLayers.OVERLAY)
        boxHelper.frustumCulled = false
        /** Add the BoxHelper to the scene */
        // this.viewer.getRenderer().scene.add(boxHelper)

        const bObj = objectBox.object
        const boxCenter = box3.getCenter(new Vector3())
        const aabbCenter = bObj.aabb.getCenter(new Vector3())
        const aabbSize = bObj.aabb.getSize(new Vector3())
        const finalPos = new Vector3()
          .copy(boxCenter)
          .sub(aabbCenter.sub(new Vector3(0, 0, aabbSize.z * 0.5)))

        const theta = Math.random() * 2 * Math.PI
        const radius = Math.random() * 150
        const x = radius * Math.cos(theta)
        const y = radius * Math.sin(theta)

        const finalRadial = boxCenter.sub(new Vector3(x, y, 0))
        this.animations.push({
          target: bObj,
          start: new Vector3(),
          end: finalPos,
          current: new Vector3(),
          time: 0,
          radialEnd: finalRadial
        })
      }
    }

    for (const categoryBox in categories) {
      /** Create a speckle text object */
      const text = new SpeckleText('test-text', ObjectLayers.OVERLAY)

      /** Simple text material */
      const material = new SpeckleTextMaterial(
        {
          color: 0x1a1a1a,
          opacity: 1,
          side: DoubleSide
        },
        ['USE_RTE', 'BILLBOARD_FIXED']
      )
      material.toneMapped = false
      material.color.convertSRGBToLinear()
      material.opacity = 1
      material.transparent = false
      material.depthTest = false
      material.billboardPixelHeight = 20
      material.userData.billboardPos.value.copy(text.position)
      ;(text.textMesh as unknown as Mesh).material = material.getDerivedMaterial()

      if (text.backgroundMesh) text.backgroundMesh.renderOrder = 3
      ;(text.textMesh as unknown as Mesh).renderOrder = 4

      /** Set the layers to PROPS, so that AO and interactions will ignore them */
      text.layers.set(ObjectLayers.OVERLAY)
      ;(text.textMesh as unknown as Mesh).layers.set(ObjectLayers.OVERLAY)
      /** Update the text with the cateogry name, size and anchor */
      await text
        .update({
          textValue: categories[categoryBox].category,
          height: 1,
          anchorX: '50%',
          anchorY: '43%'
        })
        .then(() => {
          text.style = {
            textColor: new Color(0x1a1a1a),
            backgroundColor: new Color(0xffffff),
            billboard: true,
            backgroundPixelHeight: 20
          }
          /** Move the text to the bottom center of the category box */
          text.setTransform(
            new Vector3(
              origin.x + categories[categoryBox].x,
              origin.y + categories[categoryBox].y,
              0
            )
          )
        })
      /** Add the text to the scene */
      this.textGroup.add(text)
    }
    this.viewer.getRenderer().scene.add(this.textGroup)
  }

  private easeOutQuart(x: number): number {
    return 1 - Math.pow(1 - x, 4)
  }
}
