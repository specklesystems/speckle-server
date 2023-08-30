import { Viewer } from './modules/Viewer'
import {
  DefaultLightConfiguration,
  DefaultViewerParams,
  IViewer,
  ObjectLayers,
  SelectionEvent,
  SpeckleView,
  ViewerEvent
} from './IViewer'
import {
  PropertyInfo,
  StringPropertyInfo,
  NumericPropertyInfo
} from './modules/filtering/PropertyManager'
import { SunLightConfiguration } from './IViewer'
import { DataTree, ObjectPredicate, SpeckleObject } from './modules/tree/DataTree'
import { World } from './modules/World'
import { DebugViewer } from './modules/DebugViewer'
import { NodeData, TreeNode, WorldTree } from './modules/tree/WorldTree'
import {
  PointQuery,
  QueryResult,
  IntersectionQuery,
  PointQueryResult,
  IntersectionQueryResult
} from './modules/queries/Query'
import { Utils } from './modules/Utils'
import { BatchObject } from './modules/batching/BatchObject'
import { Box3, Vector3 } from 'three'
import {
  MeasurementOptions,
  MeasurementType,
  MeasurementsExtension
} from './modules/extensions/measurements/MeasurementsExtension'
import { Units } from './modules/converter/Units'
import { SelectionExtension } from './modules/extensions/SelectionExtension'
import { CameraController } from './modules/extensions/core-extensions/CameraController'
import {
  CameraControllerEvent,
  CanonicalView,
  ICameraProvider,
  InlineView
} from './modules/extensions/core-extensions/Providers'
import { SectionTool } from './modules/extensions/SectionTool'
import { SectionOutlines } from './modules/extensions/SectionOutlines'
import { FilteringExtension } from './modules/extensions/FilteringExtension'
import { Extension } from './modules/extensions/core-extensions/Extension'
import { ExplodeExtension } from './modules/extensions/ExplodeExtension'
import {
  DiffExtension,
  DiffResult,
  VisualDiffMode
} from './modules/extensions/DiffExtension'

export {
  Viewer,
  DebugViewer,
  DefaultViewerParams,
  ViewerEvent,
  DefaultLightConfiguration,
  World,
  BatchObject,
  Box3,
  Vector3,
  WorldTree,
  VisualDiffMode,
  MeasurementType,
  Units,
  Extension,
  ICameraProvider,
  SelectionExtension,
  CameraController,
  SectionTool,
  SectionOutlines,
  MeasurementsExtension,
  FilteringExtension,
  CameraControllerEvent,
  ExplodeExtension,
  DiffExtension
}

export type {
  IViewer,
  SelectionEvent,
  PropertyInfo,
  StringPropertyInfo,
  NumericPropertyInfo,
  SunLightConfiguration,
  DataTree,
  ObjectPredicate,
  SpeckleObject,
  SpeckleView,
  CanonicalView,
  InlineView,
  TreeNode,
  NodeData,
  ObjectLayers,
  PointQuery,
  IntersectionQuery,
  QueryResult,
  PointQueryResult,
  IntersectionQueryResult,
  Utils,
  DiffResult,
  MeasurementOptions
}
