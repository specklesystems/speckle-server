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
import { AnimationGroup } from './AnimationGroup'

/** Buffers that help us avoid pointless allocations */
const vec3: Vector3 = new Vector3()
const box3: Box3 = new Box3()
const mat4: Matrix4 = new Matrix4()

export interface AnimationData {
  target: BatchObject /** The object that will get animated/translated */
  end: Vector3 /** The translation end value */
  current: Vector3 /** The translation current value */
  time: number /** The animation's current time [0,1] */
}

export interface CatalogueOptions {
  origin: Vector3 /** The origin where the objects will be centered around */
  duration: number /** Duration of the animation (if applicable) */
  labels: boolean /** Enable labels */
  objectPadding: number /** Padding between objects of the same category in meters */
  categoryPadding: number /** Padding between categories in meters */
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
  /** GSAP Timeline or our own implementation */
  private timeline: gsap.core.Timeline | AnimationGroup | null = null
  /** Optiona labels root parent */
  private labelGroup: Group = new Group()

  /** We're tying in to the viewer core's frame event */
  public onEarlyUpdate(deltaTime: number) {
    /** We only need the update callback for our own animation implementation */
    if (!this.timeline || !(this.timeline instanceof AnimationGroup)) return

    const animCount = this.timeline.update(deltaTime)
    /** If any animations updated, request a render */
    if (animCount) {
      this.viewer.requestRender()
    }
  }

  /** Triggers animation */
  public animate(reverse: boolean = false) {
    if (!this.timeline) return
    if (reverse) {
      this.enableLabels(false)
      this.timeline.reverse()
    } else {
      this.enableLabels(true)
      this.timeline.play()
    }
  }

  /** Categorizes objects by the provided property values */
  public async categorize(
    input: Array<{ ids: Array<string>; value: string }>,
    options: CatalogueOptions = {
      origin: new Vector3(),
      duration: 2,
      labels: true,
      objectPadding: 0.5,
      categoryPadding: 10
    }
  ) {
    if (this.timeline) return

    /** Map of every object's box */
    const objectBoxes: { [id: string]: ObjectBox } = {}
    /** Map of every category */
    const categories: { [categoryName: string]: CategoryBox } = {}

    for (const category of input) {
      const categoryBoxes: ObjectBox[] = []
      for (let k = 0; k < category.ids.length; k++) {
        const nodes = this.viewer.getWorldTree().findId(category.ids[k])
        if (!nodes) continue

        /** Just get the first node */
        const node = nodes[0]

        /** Get all render views associated with the node */
        const rvs = this.viewer
          .getWorldTree()
          .getRenderTree()
          .getRenderViewsForNode(node)

        /** Get their corresponding batch objects */
        rvs
          .map((rv: NodeRenderView) => {
            return this.viewer.getRenderer().getObject(rv)
          })
          /** Filter our nulls and duplicates */
          .filter((value: BatchObject | null) => {
            return value && !objectBoxes[value.renderView.renderData.id]
          })
          /** Create object boxes for each batch object with their size.
           *  x and y will be later filled out by potpack
           */
          .forEach((object: BatchObject | null) => {
            if (!object) return
            const aabbSize = object.aabb.getSize(vec3)
            const box = {
              object,
              w: aabbSize.x + options.objectPadding,
              h: aabbSize.y + options.objectPadding,
              x: 0,
              y: 0
            } as ObjectBox
            objectBoxes[object.renderView.renderData.id] = box
            categoryBoxes.push(box)
          })

        /** No displayable objects in category */
        if (!categoryBoxes.length) continue

        /** Run bin packing on all object boxes from the category.
         *  Will compute and fill out x,y for each object box
         */
        const { w, h } = potpack(categoryBoxes)

        /** Create category box */
        categories[category.value] = {
          category: category.value,
          boxes: categoryBoxes,
          w: w + options.categoryPadding,
          h: h + options.categoryPadding,
          x: 0,
          y: 0
        }
      }
    }
    /** Run bin packing on all categery boxes
     *  Will compute and fill out x,y for each category box
     */
    const { w, h } = potpack(Object.values(categories))

    /** Center around the given origin */
    options.origin.sub(new Vector3(w * 0.5, h * 0.5, 0))

    /** No animation just move translate objects */
    // this.makeNoAnimations(this.makeAnimationData(categories, options))

    /** Animate with GSAP */
    this.makeAnimationsGSAP(this.makeAnimationData(categories, options), options)

    /** Animate with our own */
    // this.makeAnimations(this.makeAnimationData(categories, options), options)

    /** Add labels */
    if (options.labels) await this.makeLabels(categories, options.origin)
  }

  private makeAnimationData(
    categories: { [categoryName: string]: CategoryBox },
    options: CatalogueOptions
  ): AnimationData[] {
    const animationData = []
    /** Assemble the object offsets and category offsets computed by potpack into target translations
     *  We take extra care to allocate as little as possible since we could be dealing with lots of objects
     */
    for (const k in categories) {
      for (let i = 0; i < categories[k].boxes.length; i++) {
        /** We make a box3 for each object based on updated position values and store it in our box buffer */
        const objectBox = categories[k].boxes[i]
        box3.min.set(objectBox.x + options.origin.x, objectBox.y + options.origin.y, 0)
        box3.max.set(
          objectBox.x + options.origin.x + objectBox.w,
          objectBox.y + options.origin.y + objectBox.h,
          0
        )
        /** We transform each object with it's category offse */
        box3.applyMatrix4(mat4.makeTranslation(categories[k].x, categories[k].y, 0))

        /** This is our target translation */
        const translationValue = new Vector3()
        /** We set it to the computed object + category offset */
        translationValue.copy(box3.getCenter(vec3))
        /** We subtract the object's current offset. Objects do not have a 0 local origin */
        translationValue.sub(objectBox.object.aabb.getCenter(vec3))
        /** We align all objects to the XY plane */
        const localSize = objectBox.object.aabb.getSize(vec3)
        localSize.set(0, 0, localSize.z * 0.5)
        translationValue.add(localSize)

        const data = {
          target: objectBox.object,
          end: translationValue,
          current: new Vector3(),
          time: 0
        } as AnimationData

        animationData.push(data)
      }
    }
    return animationData
  }

  /** No animation, just set object their target translation */
  private makeNoAnimations(animationData: AnimationData[]) {
    for (const data of animationData) {
      data.target.transformTRS(data.end)
    }
    this.viewer.getRenderer().resetPipeline()
  }

  /** Our own simple animation implementation */
  private makeAnimations(animationData: AnimationData[], options: CatalogueOptions) {
    this.timeline = new AnimationGroup()
    this.timeline.animationDuration = options.duration
    this.timeline.onStart = () => {
      this.animationStart()
    }
    this.timeline.onComplete = () => {
      this.animationEnd()
    }

    for (const data of animationData) {
      this.timeline?.animations.push(data)
    }
  }

  /** GSAP backed animation */
  private makeAnimationsGSAP(
    animationData: AnimationData[],
    options: CatalogueOptions
  ) {
    /** We use a Timeline to group and control all object animations */
    this.timeline = new gsap.core.Timeline({
      onStart: () => {
        this.animationStart()
      },
      onUpdate: () => {
        this.viewer.requestRender()
      },

      onComplete: () => {
        this.animationEnd()
      },
      onReverseComplete: () => {
        this.animationEnd()
      }
    })
    for (const data of animationData) {
      /** Create a tween with GSAP's basics */
      this.timeline.to(
        data.current,
        {
          x: data.end.x,
          y: data.end.y,
          z: data.end.z,
          duration: options.duration,
          /** We give each tween control over applying the transform. It's a bit wasteful but maybe more clear */
          onUpdate: () => {
            data.target.transformTRS(data.current)
          }
        },
        0
      )

      this.timeline.pause()
    }
  }

  /** Rendering pipeline needs to be "woken up" when an animation starts */
  private animationStart() {
    if (this.viewer.getRenderer().pipeline instanceof ProgressivePipeline) {
      ;(this.viewer.getRenderer().pipeline as ProgressivePipeline).onStationaryEnd()
    }
  }

  /** Rendering pipeline needs to be "put to sleep" when animation ends */
  private animationEnd() {
    if (this.viewer.getRenderer().pipeline instanceof ProgressivePipeline) {
      ;(this.viewer.getRenderer().pipeline as ProgressivePipeline).onStationaryBegin()
      this.viewer.getRenderer().resetPipeline()
    }
  }

  /** Optional labels for each category */
  private async makeLabels(
    categories: { [categoryName: string]: CategoryBox },
    origin: Vector3
  ) {
    for (const categoryBox in categories) {
      /** Create a speckle text object */
      const text = new SpeckleText(
        categories[categoryBox].category,
        ObjectLayers.OVERLAY
      )

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

      // if (text.backgroundMesh) text.backgroundMesh.renderOrder = 3
      // ;(text.textMesh as unknown as Mesh).renderOrder = 4

      /** Set the layers to PROPS, so that AO and interactions will ignore them */
      text.layers.set(ObjectLayers.OVERLAY)
      // ;(text.textMesh as unknown as Mesh).layers.set(ObjectLayers.OVERLAY)
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
          /** Move the text to the bottom left of the category box */
          text.setTransform(
            new Vector3(
              origin.x + categories[categoryBox].x,
              origin.y + categories[categoryBox].y,
              0
            )
          )
        })
      /** Add the text to the group */
      this.labelGroup.add(text)
    }
    /** Add the text to the scene */
    this.viewer.getRenderer().scene.add(this.labelGroup)
  }

  public enableLabels(value: boolean) {
    this.labelGroup.visible = value
  }

  public wipe() {
    this.labelGroup.clear()
    this.viewer.getRenderer().scene.remove(this.labelGroup)

    this.timeline?.clear()
    this.timeline = null
  }
}
