import {
  BatchObject,
  NodeRenderView,
  ObjectLayers,
  SpeckleText,
  SpeckleTextMaterial,
  Extension,
  ProgressivePipeline
} from '@speckle/viewer'
import potpack from 'potpack'
import { Color, Matrix4, Vector3, Box3, DoubleSide, Group, Mesh } from 'three'
import gsap from 'gsap'

export interface AnimationData {
  target: BatchObject
  end: Vector3
  current: Vector3
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
  private timeline: gsap.core.Timeline | null = null
  private textGroup: Group = new Group()

  /** We're tying in to the viewer core's frame event */
  public onEarlyUpdate(deltaTime: number) {
    // const animCount = this.animationGroup.update(deltaTime)
    // /** If any animations updated, request a render */
    // if (animCount) {
    // this.viewer.requestRender()
    // }
  }

  public animate(reverse: boolean = false) {
    if (!this.timeline) return
    reverse ? this.timeline.reverse() : this.timeline.play()
  }

  /** Example's main function */
  public async categorize(
    input: Array<{ ids: Array<string>; value: string }>,
    annotations = false
  ) {
    if (this.timeline) return

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

    this.makeAnimations(categories, origin)
    annotations && (await this.makeAnnotations(categories, origin))
  }

  private makeAnimations(
    categories: { [categoryName: string]: CategoryBox },
    origin: Vector3
  ) {
    this.timeline = new gsap.core.Timeline({
      onStart: () => {
        if (this.viewer.getRenderer().pipeline instanceof ProgressivePipeline) {
          ;(this.viewer.getRenderer().pipeline as ProgressivePipeline).onStationaryEnd()
        }
      },
      onUpdate: () => {
        this.viewer.requestRender()
      },

      onComplete: () => {
        if (this.viewer.getRenderer().pipeline instanceof ProgressivePipeline) {
          ;(
            this.viewer.getRenderer().pipeline as ProgressivePipeline
          ).onStationaryBegin()
          this.viewer.getRenderer().resetPipeline()
        }
      },
      onReverseComplete: () => {
        if (this.viewer.getRenderer().pipeline instanceof ProgressivePipeline) {
          ;(
            this.viewer.getRenderer().pipeline as ProgressivePipeline
          ).onStationaryBegin()
          this.viewer.getRenderer().resetPipeline()
        }
      }
    })
    let delay = 0
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

        const bObj = objectBox.object
        const boxCenter = box3.getCenter(new Vector3())
        const aabbCenter = bObj.aabb.getCenter(new Vector3())
        const aabbSize = bObj.aabb.getSize(new Vector3())
        const finalPos = new Vector3()
          .copy(boxCenter)
          .sub(aabbCenter.sub(new Vector3(0, 0, aabbSize.z * 0.5)))

        const data = {
          target: bObj,
          end: finalPos,
          current: new Vector3()
        }
        this.timeline.to(
          data.current,
          {
            x: finalPos.x,
            y: finalPos.y,
            z: finalPos.z,
            duration: 2,
            onUpdate: () => {
              data.target.transformTRS(data.current, undefined, undefined, undefined)
            }
          },
          delay
        )

        this.timeline.pause()
      }
      delay += 0.01
    }
  }

  private async makeAnnotations(
    categories: { [categoryName: string]: CategoryBox },
    origin: Vector3
  ) {
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

  public wipe() {
    this.textGroup.clear()
    this.viewer.getRenderer().scene.remove(this.textGroup)

    this.timeline?.clear()
    this.timeline = null
  }
}
