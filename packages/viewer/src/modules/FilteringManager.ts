import { Color, Texture } from 'three'

export enum FilterMaterialType {
  SELECT,
  GHOST,
  GRADIENT,
  COLORED,
  OVERLAY,
  HIDDEN
}

export interface FilterMaterial {
  filterType: FilterMaterialType
  rampIndex?: number
  rampIndexColor?: Color
  rampTexture?: Texture
}

export class FilteringManager {
  // TO DO
}
