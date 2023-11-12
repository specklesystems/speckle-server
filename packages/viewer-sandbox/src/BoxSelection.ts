/* eslint-disable @typescript-eslint/ban-ts-comment */
import { InputEvent } from '@speckle/viewer'
import { ObjectLayers } from '@speckle/viewer'
import { Extension, ICameraProvider, IViewer } from '@speckle/viewer'
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
    return [ICameraProvider.Symbol]
  }

  private material: ShaderMaterial
  private quad: Mesh
  private ndc0: Vector2 = new Vector2()
  private ndc1: Vector2 = new Vector2()
  private dragging = false

  public constructor(viewer: IViewer, private cameraController: ICameraProvider) {
    super(viewer)

    viewer.getRenderer().input.on(InputEvent.PointerDown, this.onPointerDown.bind(this))
    viewer.getRenderer().input.on(InputEvent.PointerUp, this.onPointerUp.bind(this))
    viewer.getRenderer().input.on(InputEvent.PointerMove, this.onPointerMove.bind(this))

    const quadGeometry = new BufferGeometry()
    quadGeometry.setAttribute(
      'position',
      new BufferAttribute(
        new Float32Array([
          -1.0,
          -1.0,
          1.0, // v0
          1.0,
          -1.0,
          1.0, // v1
          1.0,
          1.0,
          1.0, // v2

          1.0,
          1.0,
          1.0, // v3
          -1.0,
          1.0,
          1.0, // v4
          -1.0,
          -1.0,
          1.0 // v5), 3)
        ]),
        3
      )
    )

    this.material = new ShaderMaterial({
      uniforms: {
        transform: { value: new Matrix4().makeScale(0, 0, 0) },
        color: {
          value: new Vector4(
            0.01568627450980392,
            0.49411764705882355,
            0.984313725490196,
            0.5
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
    this.material.transparent = true

    this.quad = new Mesh(quadGeometry, this.material)
    this.quad.layers.set(ObjectLayers.OVERLAY)
    this.quad.frustumCulled = false
    this.viewer.getRenderer().scene.add(this.quad)
  }

  private onPointerDown(e) {
    if (e.event.altKey) {
      this.cameraController.enabled = false
      this.dragging = true
      this.ndc0.copy(e)
    }
  }

  private onPointerUp() {
    this.cameraController.enabled = true
    this.material.uniforms.transform.value = new Matrix4().makeScale(0, 0, 0)
    this.material.needsUpdate = true
    this.dragging = false
    this.viewer.requestRender()
  }

  private onPointerMove(e) {
    if (!e.event.altKey || !this.dragging) return

    this.ndc1.copy(e)
    const xmin = Math.min(this.ndc0.x, this.ndc1.x)
    const xmax = Math.max(this.ndc0.x, this.ndc1.x)
    const ymin = Math.min(this.ndc0.y, this.ndc1.y)
    const ymax = Math.max(this.ndc0.y, this.ndc1.y)
    const box = new Box3(new Vector3(xmin, ymin, 0), new Vector3(xmax, ymax, 0))
    const scale = box.getSize(new Vector3())
    this.material.uniforms.transform.value = new Matrix4()
      .makeTranslation(
        this.ndc0.x + (this.ndc1.x - this.ndc0.x) * 0.5,
        this.ndc0.y + (this.ndc1.y - this.ndc0.y) * 0.5,
        0
      )
      .multiply(new Matrix4().makeScale(scale.x * 0.5, scale.y * 0.5, 1))

    this.material.needsUpdate = true
    this.viewer.requestRender()
  }
}
