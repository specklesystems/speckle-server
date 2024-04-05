import { Viewer } from './modules/Viewer'
import {
  DefaultLightConfiguration,
  DefaultViewerParams,
  IViewer,
  ObjectLayers,
  SelectionEvent,
  SpeckleView,
  UpdateFlags,
  ViewerEvent,
  ViewerParams
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
import { CameraController } from './modules/extensions/CameraController'
import { InlineView } from './modules/extensions/CameraController'
import { CanonicalView } from './modules/extensions/CameraController'
import { CameraEvent } from './modules/objects/SpeckleCamera'
import { SectionTool } from './modules/extensions/SectionTool'
import { SectionOutlines } from './modules/extensions/SectionOutlines'
import {
  FilteringExtension,
  FilteringState
} from './modules/extensions/FilteringExtension'
import { Extension } from './modules/extensions/Extension'
import { ExplodeExtension } from './modules/extensions/ExplodeExtension'
import {
  DiffExtension,
  DiffResult,
  VisualDiffMode
} from './modules/extensions/DiffExtension'
import { Loader } from './modules/loaders/Loader'
import { SpeckleLoader } from './modules/loaders/Speckle/SpeckleLoader'
import { ObjLoader } from './modules/loaders/OBJ/ObjLoader'
import { LegacyViewer } from './modules/LegacyViewer'
import { SpeckleType } from './modules/loaders/GeometryConverter'
import Input, { InputEvent } from './modules/input/Input'
import { GeometryType } from './modules/batching/Batch'
import { MeshBatch } from './modules/batching/MeshBatch'
import SpeckleStandardMaterial from './modules/materials/SpeckleStandardMaterial'
import SpeckleTextMaterial from './modules/materials/SpeckleTextMaterial'
import { SpeckleText } from './modules/objects/SpeckleText'
import { NodeRenderView } from './modules/tree/NodeRenderView'

export {
  Viewer,
  DebugViewer,
  LegacyViewer,
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
  SelectionExtension,
  CameraController,
  SectionTool,
  SectionOutlines,
  MeasurementsExtension,
  FilteringExtension,
  CameraEvent,
  ExplodeExtension,
  DiffExtension,
  Loader,
  SpeckleLoader,
  ObjLoader,
  UpdateFlags,
  SpeckleType,
  Input,
  InputEvent,
  ObjectLayers,
  GeometryType,
  MeshBatch,
  SpeckleStandardMaterial,
  SpeckleTextMaterial,
  SpeckleText,
  NodeRenderView
}

export type {
  IViewer,
  ViewerParams,
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
  PointQuery,
  IntersectionQuery,
  QueryResult,
  PointQueryResult,
  IntersectionQueryResult,
  Utils,
  DiffResult,
  MeasurementOptions,
  FilteringState
}
