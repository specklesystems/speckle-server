import { Viewer } from './modules/Viewer'
import {
  AssetType,
  DefaultLightConfiguration,
  DefaultViewerParams,
  type IViewer,
  ObjectLayers,
  type SelectionEvent,
  type SpeckleObject,
  type SpeckleReference,
  type SpeckleView,
  UpdateFlags,
  ViewerEvent,
  type ViewerParams,
  LightConfiguration,
  ViewerEventPayload
} from './IViewer'
import type {
  PropertyInfo,
  StringPropertyInfo,
  NumericPropertyInfo
} from './modules/filtering/PropertyManager'
import { type SunLightConfiguration } from './IViewer'
import { World } from './modules/World'
import { type NodeData, type TreeNode, WorldTree } from './modules/tree/WorldTree'
import type {
  PointQuery,
  QueryResult,
  IntersectionQuery,
  PointQueryResult,
  IntersectionQueryResult
} from './modules/queries/Query'
import { type Utils } from './modules/Utils'
import { BatchObject } from './modules/batching/BatchObject'
import { Box3, Vector3 } from 'three'
import {
  type MeasurementOptions,
  MeasurementType,
  MeasurementsExtension
} from './modules/extensions/measurements/MeasurementsExtension'
import { Units } from './modules/converter/Units'
import { SelectionExtension } from './modules/extensions/SelectionExtension'
import { CameraController } from './modules/extensions/CameraController'
import { type InlineView } from './modules/extensions/CameraController'
import { type CanonicalView } from './modules/extensions/CameraController'
import { CameraEvent, CameraEventPayload } from './modules/objects/SpeckleCamera'
import { SectionTool, SectionToolEventPayload } from './modules/extensions/SectionTool'
import { SectionOutlines } from './modules/extensions/SectionOutlines'
import {
  FilteringExtension,
  type FilteringState
} from './modules/extensions/FilteringExtension'
import { Extension } from './modules/extensions/Extension'
import { ExplodeExtension } from './modules/extensions/ExplodeExtension'
import {
  DiffExtension,
  type DiffResult,
  VisualDiffMode
} from './modules/extensions/DiffExtension'
import { Loader, LoaderEvent } from './modules/loaders/Loader'
import { SpeckleLoader } from './modules/loaders/Speckle/SpeckleLoader'
import { ObjLoader } from './modules/loaders/OBJ/ObjLoader'
import { LegacyViewer } from './modules/LegacyViewer'
import { SpeckleType } from './modules/loaders/GeometryConverter'
import Input, { InputEvent, InputEventPayload } from './modules/input/Input'
import { GeometryType } from './modules/batching/Batch'
import { MeshBatch } from './modules/batching/MeshBatch'
import SpeckleStandardMaterial from './modules/materials/SpeckleStandardMaterial'
import SpeckleTextMaterial from './modules/materials/SpeckleTextMaterial'
import { SpeckleText } from './modules/objects/SpeckleText'
import { NodeRenderView } from './modules/tree/NodeRenderView'
import { type ExtendedIntersection } from './modules/objects/SpeckleRaycaster'
import { SpeckleGeometryConverter } from './modules/loaders/Speckle/SpeckleGeometryConverter'
import { Assets } from './modules/Assets'
import { SpecklePass } from './modules/pipeline/SpecklePass'
import { InstancedBatchObject } from './modules/batching/InstancedBatchObject'

export {
  Viewer,
  LegacyViewer,
  DefaultViewerParams,
  ViewerEvent,
  DefaultLightConfiguration,
  World,
  BatchObject,
  InstancedBatchObject,
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
  LoaderEvent,
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
  NodeRenderView,
  SpeckleGeometryConverter,
  Assets,
  AssetType
}

export type {
  IViewer,
  ViewerParams,
  SelectionEvent,
  PropertyInfo,
  StringPropertyInfo,
  NumericPropertyInfo,
  LightConfiguration,
  SunLightConfiguration,
  SpeckleObject,
  SpeckleReference,
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
  FilteringState,
  ExtendedIntersection,
  ViewerEventPayload,
  InputEventPayload,
  SectionToolEventPayload,
  CameraEventPayload,
  SpecklePass
}

export * as UrlHelper from './modules/UrlHelper'
