export enum FilterMaterialType {
  SELECT,
  GHOST,
  GRADIENT
}
export interface FilterMaterial {
  filterType: FilterMaterialType
  gradientIndex?: number
}

export class FilteringManager {
  // TO DO
}
