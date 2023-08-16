import { Viewer } from './modules/Viewer'
import {
  DefaultLightConfiguration,
  DefaultViewerParams,
  IViewer,
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
import { ObjectLayers } from './modules/SpeckleRenderer'
import { DiffResult, VisualDiffMode } from './modules/Differ'
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
  CanonicalView,
  ICameraProvider,
  InlineView
} from './modules/extensions/core-extensions/Providers'
import { SectionTool } from './modules/extensions/SectionTool'
import { SectionOutlines } from './modules/extensions/SectionOutlines'

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
  SelectionExtension,
  CameraController,
  SectionTool,
  SectionOutlines,
  MeasurementsExtension
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
  MeasurementOptions,
  ICameraProvider
}
