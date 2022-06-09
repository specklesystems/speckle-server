import { BufferGeometry } from 'three'
import { NodeRenderView } from './NodeRenderView'

export default class Batch {
  private renderViews: NodeRenderView[]
  private bufferGeometry: BufferGeometry

  public constructor() {
    this.bufferGeometry = new BufferGeometry()
  }

  public addRenderView(renderView: NodeRenderView) {
    this.renderViews.push(renderView)
  }
}
