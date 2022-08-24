import { Viewer } from './modules/Viewer'
import {
  DefaultLightConfiguration,
  DefaultViewerParams,
  IViewer,
  SelectionEvent,
  ViewerEvent
} from './IViewer'
import { FilteringState } from './modules/filtering/FilteringManager'
import {
  PropertyInfo,
  StringPropertyInfo,
  NumericPropertyInfo
} from './modules/filtering/PropertyManager'

import { SunLightConfiguration } from './IViewer'
import { DataTree, ObjectPredicate, SpeckleObject } from './modules/tree/DataTree'
import { World } from './modules/World'

export { Viewer, DefaultViewerParams, ViewerEvent, DefaultLightConfiguration, World }

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
