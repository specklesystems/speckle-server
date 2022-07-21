import { Texture } from 'three'

export enum FilterMaterialType {
  SELECT,
  GHOST,
  GRADIENT,
  COLORED
}

export interface FilterMaterial {
  filterType: FilterMaterialType
  rampIndex?: number
  rampTexture?: Texture
}

export class FilteringManager {
  // TO DO
}
