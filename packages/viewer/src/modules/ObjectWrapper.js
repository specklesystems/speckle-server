/**
 * Class that wraps around a buffer geometry and any remaining speckle object
 * metadata. Used to match the two in the renderer.
 */
export default class ObjectWrapper {
  constructor( bufferGeometry, meta, geometryType ) {
    if ( !bufferGeometry ) throw new Error( 'No geometry provided.' )
    this.bufferGeometry = bufferGeometry
    this.meta = meta
    this.geometryType = geometryType || 'solid'
  }
}
