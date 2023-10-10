import { MeshBatch } from '@speckle/viewer'
import { ObjectLayers } from '@speckle/viewer'
import { GeometryType } from '@speckle/viewer'
import { Extension } from '@speckle/viewer'
import { EdgesGeometry, LineBasicMaterial, LineSegments } from 'three'

export class Edges extends Extension {
  private edges: Array<LineSegments> = []
  private _threshold: number = 1

  public set threshold(value: number) {
    this._threshold = value
    this.generate()
  }

  public generate() {
    const start = performance.now()
    for (let k = 0; k < this.edges.length; k++) {
      this.viewer.getRenderer().scene.remove(this.edges[k])
    }

    const meshes = this.viewer
      .getRenderer()
      .batcher.getBatches(undefined, GeometryType.MESH) as MeshBatch[]

    for (let k = 0; k < meshes.length; k++) {
      const edges = new EdgesGeometry(meshes[k].mesh.geometry, this._threshold)
      const line = new LineSegments(edges, new LineBasicMaterial({ color: 0xff0000 }))
      line.layers.set(ObjectLayers.PROPS)
      this.edges.push(line)
      this.viewer.getRenderer().scene.add(line)
    }
    console.log('Edge time -> ', performance.now() - start)
    this.viewer.requestRender()
  }
}
