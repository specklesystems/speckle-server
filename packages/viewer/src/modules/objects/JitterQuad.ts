import {
  BufferGeometry,
  Float32BufferAttribute,
  Material,
  Mesh,
  OrthographicCamera,
  WebGLRenderer
} from 'three'

export class JitterQuad {
  private _camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)
  private mesh: Mesh

  get camera() {
    return this._camera
  }
  get material() {
    return this.mesh.material
  }

  set material(value) {
    this.mesh.material = value
  }

  public constructor(material?: Material) {
    const _geometry = new BufferGeometry()
    _geometry.setAttribute(
      'position',
      new Float32BufferAttribute([-1, 3, 0, -1, -1, 0, 3, -1, 0], 3)
    )
    _geometry.setAttribute('uv', new Float32BufferAttribute([0, 2, 0, 0, 2, 0], 2))
    this.mesh = new Mesh(_geometry, material)
  }

  public render(renderer: WebGLRenderer) {
    renderer.render(this.mesh, this._camera)
  }
}
