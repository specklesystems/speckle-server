import { Viewer } from './modules/Viewer.js'
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
} from './IViewer.js'
import type {
  PropertyInfo,
  StringPropertyInfo,
  NumericPropertyInfo
} from './modules/filtering/PropertyManager.js'
import { type SunLightConfiguration } from './IViewer.js'
import { World } from './modules/World.js'
import { type NodeData, type TreeNode, WorldTree } from './modules/tree/WorldTree.js'
import type {
  PointQuery,
  QueryResult,
  IntersectionQuery,
  PointQueryResult,
  IntersectionQueryResult
} from './modules/queries/Query.js'
import { type Utils } from './modules/Utils.js'
import { BatchObject } from './modules/batching/BatchObject.js'
import { Box3, Vector3 } from 'three'
import {
  type MeasurementOptions,
  MeasurementType,
  MeasurementsExtension
} from './modules/extensions/measurements/MeasurementsExtension.js'
import { Units } from './modules/converter/Units.js'
import { SelectionExtension } from './modules/extensions/SelectionExtension.js'
import { CameraController } from './modules/extensions/CameraController.js'
import { type InlineView } from './modules/extensions/CameraController.js'
import { type CanonicalView } from './modules/extensions/CameraController.js'
import { CameraEvent, CameraEventPayload } from './modules/objects/SpeckleCamera.js'
import {
  SectionTool,
  SectionToolEventPayload
} from './modules/extensions/SectionTool.js'
import { SectionOutlines } from './modules/extensions/SectionOutlines.js'
import {
  FilteringExtension,
  type FilteringState
} from './modules/extensions/FilteringExtension.js'
import { Extension } from './modules/extensions/Extension.js'
import { ExplodeExtension } from './modules/extensions/ExplodeExtension.js'
import {
  DiffExtension,
  type DiffResult,
  VisualDiffMode
} from './modules/extensions/DiffExtension.js'
import { Loader, LoaderEvent } from './modules/loaders/Loader.js'
import { SpeckleLoader } from './modules/loaders/Speckle/SpeckleLoader.js'
import { ObjLoader } from './modules/loaders/OBJ/ObjLoader.js'
import { LegacyViewer } from './modules/LegacyViewer.js'
import { SpeckleType } from './modules/loaders/GeometryConverter.js'
import Input, { InputEvent, InputEventPayload } from './modules/input/Input.js'
import { GeometryType } from './modules/batching/Batch.js'
import { MeshBatch } from './modules/batching/MeshBatch.js'
import SpeckleStandardMaterial from './modules/materials/SpeckleStandardMaterial.js'
import SpeckleTextMaterial from './modules/materials/SpeckleTextMaterial.js'
import { SpeckleText } from './modules/objects/SpeckleText.js'
import { NodeRenderView } from './modules/tree/NodeRenderView.js'
import { type ExtendedIntersection } from './modules/objects/SpeckleRaycaster.js'
import { SpeckleGeometryConverter } from './modules/loaders/Speckle/SpeckleGeometryConverter.js'
import { Assets } from './modules/Assets.js'
import { SpecklePass } from './modules/pipeline/SpecklePass.js'
import { InstancedBatchObject } from './modules/batching/InstancedBatchObject.js'
import { HybridCameraController } from './modules/extensions/HybridCameraController.js'

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
  AssetType,
  HybridCameraController
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

export * as UrlHelper from './modules/UrlHelper.js'
