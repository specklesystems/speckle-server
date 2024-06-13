/* eslint-disable camelcase */
/**
 * Basic 'Base'-like object from .NET. It will create a 'speckle_type' prop that defaults to the class' name. This can be overriden by providing yourself a 'speckle_type' property in the props argument of the constructor.
 */
export class Base implements Record<string, unknown> {
  speckle_type: string
  constructor(props?: Record<string, unknown>) {
    this.speckle_type = this.constructor.name

    if (props) {
      for (const key in props) this[key] = props[key]
    }
  }
  [x: string]: unknown
}
