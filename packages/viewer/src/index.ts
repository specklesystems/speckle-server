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
  ViewerEventPayload,
  StencilOutlineType
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
import {
  type MeasurementOptions,
  MeasurementType,
  MeasurementsExtension,
  MeasurementEvent,
  MeasurementEventPayload
} from './modules/extensions/measurements/MeasurementsExtension.js'
import { Units } from './modules/converter/Units.js'
import {
  SelectionExtension,
  SelectionExtensionOptions,
  DefaultSelectionExtensionOptions
} from './modules/extensions/SelectionExtension.js'
import {
  CameraController,
  CameraControllerOptions,
  NearPlaneCalculation
} from './modules/extensions/CameraController.js'
import { type InlineView } from './modules/extensions/CameraController.js'
import { type CanonicalView } from './modules/extensions/CameraController.js'
import { CameraEvent, CameraEventPayload } from './modules/objects/SpeckleCamera.js'

import { SectionOutlines } from './modules/extensions/sections/SectionOutlines.js'
import {
  FilteringExtension,
  type FilteringState
} from './modules/extensions/FilteringExtension.js'
import { Extension } from './modules/extensions/Extension.js'
import {
  ExplodeEvent,
  ExplodeExtension
} from './modules/extensions/ExplodeExtension.js'
import {
  DiffExtension,
  type DiffResult,
  VisualDiffMode
} from './modules/extensions/DiffExtension.js'
import { Loader, LoaderEvent } from './modules/loaders/Loader.js'
import { SpeckleLoader } from './modules/loaders/Speckle/SpeckleLoader.js'
import { ObjLoader } from './modules/loaders/OBJ/ObjLoader.js'
import { LegacyViewer } from './modules/LegacyViewer.js'
import { GeometryConverter, SpeckleType } from './modules/loaders/GeometryConverter.js'
import Input, { InputEvent, InputEventPayload } from './modules/input/Input.js'
import { GeometryType } from './modules/batching/Batch.js'
import { MeshBatch } from './modules/batching/MeshBatch.js'
import SpeckleStandardMaterial from './modules/materials/SpeckleStandardMaterial.js'
import SpeckleTextMaterial from './modules/materials/SpeckleTextMaterial.js'
import { TextLabel } from './modules/objects/TextLabel.js'
import { NodeRenderView } from './modules/tree/NodeRenderView.js'
import {
  CONTAINED,
  INTERSECTED,
  NOT_INTERSECTED,
  type ExtendedIntersection
} from './modules/objects/SpeckleRaycaster.js'
import { SpeckleGeometryConverter } from './modules/loaders/Speckle/SpeckleGeometryConverter.js'
import { Assets } from './modules/Assets.js'
import { InstancedBatchObject } from './modules/batching/InstancedBatchObject.js'
import { HybridCameraController } from './modules/extensions/HybridCameraController.js'
import SpeckleBasicMaterial from './modules/materials/SpeckleBasicMaterial.js'
import LineBatch from './modules/batching/LineBatch.js'
import { PointBatch } from './modules/batching/PointBatch.js'
import TextBatch from './modules/batching/TextBatch.js'
import { ArcticViewPipeline } from './modules/pipeline/Pipelines/ArcticViewPipeline.js'
import { DefaultPipeline } from './modules/pipeline/Pipelines/DefaultPipeline.js'
import { PenViewPipeline } from './modules/pipeline/Pipelines/PenViewPipeline.js'
import { SolidViewPipeline } from './modules/pipeline/Pipelines/SolidViewPipeline.js'
import { TAAPipeline } from './modules/pipeline/Pipelines/TAAPipeline.js'
import SpeckleRenderer from './modules/SpeckleRenderer.js'
import { RenderTree } from './modules/tree/RenderTree.js'
import SpeckleConverter from './modules/loaders/Speckle/SpeckleConverter.js'
import { ViewMode, ViewModes } from './modules/extensions/ViewModes.js'
import {
  BaseGPass,
  ClearFlags,
  GPass,
  ObjectVisibility,
  PassOptions,
  ProgressiveGPass
} from './modules/pipeline/Passes/GPass.js'
import {
  PipelineOptions,
  BasePipelineOptions,
  DefaultPipelineOptions,
  Pipeline
} from './modules/pipeline/Pipelines/Pipeline.js'
import { ProgressivePipeline } from './modules/pipeline/Pipelines/ProgressivePipeline.js'
import { DepthPass, DepthPassOptions } from './modules/pipeline/Passes/DepthPass.js'
import { GeometryPass } from './modules/pipeline/Passes/GeometryPass.js'
import { NormalsPass } from './modules/pipeline/Passes/NormalsPass.js'
import {
  InputType,
  OutputPass,
  OutputPassOptions
} from './modules/pipeline/Passes/OutputPass.js'
import {
  ViewportPass,
  ViewportPassOptions
} from './modules/pipeline/Passes/ViewportPass.js'
import { BlendPass, BlendPassOptions } from './modules/pipeline/Passes/BlendPass.js'
import { DepthNormalPass } from './modules/pipeline/Passes/DepthNormalPass.js'
import { ShadedPass } from './modules/pipeline/Passes/ShadedPass.js'
import {
  DefaultProgressiveAOPassOptions,
  ProgressiveAOPass,
  ProgressiveAOPassOptions
} from './modules/pipeline/Passes/ProgressiveAOPass.js'
import { TAAPass } from './modules/pipeline/Passes/TAAPass.js'
import {
  FilterMaterial,
  FilterMaterialOptions,
  FilterMaterialType
} from './modules/materials/Materials.js'
import { SpeckleOfflineLoader } from './modules/loaders/Speckle/SpeckleOfflineLoader.js'
import { AccelerationStructure } from './modules/objects/AccelerationStructure.js'
import { TopLevelAccelerationStructure } from './modules/objects/TopLevelAccelerationStructure.js'
import { StencilPass } from './modules/pipeline/Passes/StencilPass.js'
import { SpeckleWebGLRenderer } from './modules/objects/SpeckleWebGLRenderer.js'
import { InstancedMeshBatch } from './modules/batching/InstancedMeshBatch.js'
import { ViewModeEvent, ViewModeEventPayload } from './modules/extensions/ViewModes.js'
import { ShadedViewPipeline } from './modules/pipeline/Pipelines/ShadedViewPipeline.js'
import SpeckleMesh from './modules/objects/SpeckleMesh.js'
import SpeckleInstancedMesh from './modules/objects/SpeckleInstancedMesh.js'
import {
  SectionTool,
  SectionToolEvent,
  SectionToolEventPayload
} from './modules/extensions/sections/SectionTool.js'
import { WebXrViewer } from './modules/WebXrViewer.js'
import { StencilMaskPass } from './modules/pipeline/Passes/StencilMaskPass.js'
import {
  DefaultEdgesPassOptions,
  EdgesPass,
  EdgesPassOptions
} from './modules/pipeline/Passes/EdgesPass.js'
import {
  Measurement,
  MeasurementState
} from './modules/extensions/measurements/Measurement.js'
import { PointToPointMeasurement } from './modules/extensions/measurements/PointToPointMeasurement.js'
import { PerpendicularMeasurement } from './modules/extensions/measurements/PerpendicularMeasurement.js'
import { AreaMeasurement } from './modules/extensions/measurements/AreaMeasurement.js'
import { PointMeasurement } from './modules/extensions/measurements/PointMeasurement.js'
import {
  DefaultEdgesPipelineOptions,
  EdgesPipeline
} from './modules/pipeline/Pipelines/EdgesPipeline.js'
import { Geometry } from './modules/converter/Geometry.js'
import {
  ObjectPickConfiguration,
  DefaultObjectPickConfiguration
} from './modules/SpeckleRenderer.js'
export {
  Viewer,
  LegacyViewer,
  WebXrViewer,
  SpeckleWebGLRenderer,
  DefaultViewerParams,
  ViewerEvent,
  ObjectPickConfiguration,
  DefaultLightConfiguration,
  DefaultObjectPickConfiguration,
  World,
  BatchObject,
  InstancedBatchObject,
  WorldTree,
  RenderTree,
  VisualDiffMode,
  Measurement,
  PointToPointMeasurement,
  PerpendicularMeasurement,
  AreaMeasurement,
  PointMeasurement,
  MeasurementType,
  MeasurementEvent,
  MeasurementState,
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
  ExplodeEvent,
  DiffExtension,
  Loader,
  SpeckleConverter,
  GeometryConverter,
  Geometry,
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
  InstancedMeshBatch,
  LineBatch,
  PointBatch,
  TextBatch,
  AccelerationStructure,
  TopLevelAccelerationStructure,
  SpeckleStandardMaterial,
  SpeckleBasicMaterial,
  SpeckleTextMaterial,
  TextLabel,
  NodeRenderView,
  SpeckleGeometryConverter,
  Assets,
  AssetType,
  HybridCameraController,
  SpeckleRenderer,
  SectionToolEvent,
  StencilOutlineType,
  GPass,
  BaseGPass,
  ProgressiveGPass,
  DepthPass,
  GeometryPass,
  NormalsPass,
  OutputPass,
  ViewportPass,
  BlendPass,
  DepthNormalPass,
  ShadedPass as BasitPass,
  ProgressiveAOPass,
  TAAPass,
  StencilPass,
  StencilMaskPass,
  EdgesPass,
  PassOptions,
  EdgesPassOptions as EdgePassOptions,
  BlendPassOptions,
  DepthPassOptions,
  OutputPassOptions,
  ProgressiveAOPassOptions,
  ViewportPassOptions,
  DefaultEdgesPassOptions,
  DefaultProgressiveAOPassOptions,
  ClearFlags,
  ObjectVisibility,
  InputType,
  Pipeline,
  ProgressivePipeline,
  DefaultPipeline,
  EdgesPipeline,
  SolidViewPipeline,
  PenViewPipeline,
  ArcticViewPipeline,
  TAAPipeline,
  ShadedViewPipeline,
  PipelineOptions,
  BasePipelineOptions,
  DefaultPipelineOptions,
  DefaultEdgesPipelineOptions,
  ViewModes,
  ViewMode,
  FilterMaterial,
  FilterMaterialType,
  FilterMaterialOptions,
  SpeckleOfflineLoader,
  NOT_INTERSECTED,
  INTERSECTED,
  CONTAINED,
  ViewModeEvent,
  SpeckleMesh,
  SpeckleInstancedMesh,
  CameraControllerOptions,
  NearPlaneCalculation
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
  SelectionExtensionOptions,
  DefaultSelectionExtensionOptions,
  ViewModeEventPayload,
  MeasurementEventPayload
}

export * as UrlHelper from './modules/UrlHelper.js'
