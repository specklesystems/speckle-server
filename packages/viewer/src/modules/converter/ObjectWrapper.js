/**
 * Class that wraps around a buffer geometry and any remaining speckle object
 * metadata. Used to match the two in the renderer.
 */
export default class ObjectWrapper {
  constructor( bufferGeometry, meta, geometryType, extras ) {
    this.bufferGeometry = bufferGeometry
    this.meta = meta
    this.geometryType = geometryType || 'solid'
    this.extras = extras
  }
}
