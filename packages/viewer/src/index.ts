import { Viewer } from './modules/Viewer'
import Converter from './modules/converter/Converter'
import { DefaultViewerParams, IViewer, SelectionEvent } from './IViewer'
import SpeckleLineMaterial from './modules/materials/SpeckleLineMaterial'
import {
  FilterMaterialType,
  FilteringState
} from './modules/filtering/FilteringManager'
import {
  PropertyInfo,
  StringPropertyInfo,
  NumericPropertyInfo
} from './modules/filtering/PropertyManager'

import { WorldTree } from './modules/tree/WorldTree'
import { SpeckleType } from './modules/converter/GeometryConverter'
import { GeometryConverter } from './modules/converter/GeometryConverter'
import { SunLightConfiguration } from './IViewer'
import { DataTree, ObjectPredicate, SpeckleObject } from './modules/tree/DataTree'

export {
  Viewer,
  Converter,
  DefaultViewerParams,
  SpeckleLineMaterial,
  FilterMaterialType as FilterMaterial,
  WorldTree,
  SpeckleType,
  GeometryConverter
}

export type {
  IViewer,
  SelectionEvent,
  PropertyInfo,
  StringPropertyInfo,
  NumericPropertyInfo,
  FilteringState,
  SunLightConfiguration,
  DataTree,
  ObjectPredicate,
  SpeckleObject
}
