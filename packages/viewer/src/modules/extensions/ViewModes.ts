import { IViewer, UpdateFlags, ViewerEvent } from '../../IViewer.js'
import { ShadedPass } from '../pipeline/Passes/ShadedPass.js'
import { GPass } from '../pipeline/Passes/GPass.js'
import { ArcticViewPipeline } from '../pipeline/Pipelines/ArcticViewPipeline.js'
import { ShadedViewPipeline } from '../pipeline/Pipelines/ShadedViewPipeline.js'
import { DefaultPipeline } from '../pipeline/Pipelines/DefaultPipeline.js'
import { PenViewPipeline } from '../pipeline/Pipelines/PenViewPipeline.js'
import { SolidViewPipeline } from '../pipeline/Pipelines/SolidViewPipeline.js'
import { Extension } from './Extension.js'
import { FilteringExtension, FilteringState } from './FilteringExtension.js'
import {
  DefaultPipelineOptions,
  PipelineOptions
} from '../pipeline/Pipelines/Pipeline.js'
import {
  DefaultEdgesPipelineOptions,
  EdgesPipelineOptions
} from '../pipeline/Pipelines/EdgesPipeline.js'
import { DefaultEdgesPassOptions } from '../pipeline/Passes/EdgesPass.js'

export enum ViewMode {
  DEFAULT,
  SOLID,
  PEN,
  ARCTIC,
  SHADED
}

export enum ViewModeEvent {
  Changed = 'view-mode-changed'
}

export interface ViewModeEventPayload {
  [ViewModeEvent.Changed]: ViewMode
}

export type ViewModeOptions = PipelineOptions & EdgesPipelineOptions

export class ViewModes extends Extension {
  public get inject() {
    return [FilteringExtension]
  }

  protected _viewModeOptions: Required<ViewModeOptions> = Object.assign(
    {},
    DefaultPipelineOptions,
    DefaultEdgesPipelineOptions
  )
  public get viewModeOptions(): ViewModeOptions {
    return this.viewModeOptions
  }

  protected _viewMode: ViewMode
  public get viewMode(): ViewMode {
    return this._viewMode
  }

  public constructor(
    viewer: IViewer,
    protected filteringExtension: FilteringExtension
  ) {
    super(viewer)
    /** Not a super fan of this, but it avoids us caching another set of per vertex color indices */
    if (filteringExtension)
      filteringExtension.on(ViewerEvent.FilteringStateSet, (arg: FilteringState) => {
        /** If no texture colored filters are present */
        if (
          (!arg.colorGroups || !arg.colorGroups.length) &&
          (!arg.userColorGroups || !arg.userColorGroups.length)
        ) {
          /** If any shaded pass exists, set it's required color indices */
          this.viewer
            .getRenderer()
            .pipeline.getPass('SHADED')
            .forEach((pass: GPass) => {
              ;(pass as ShadedPass).applyColorIndices()
            })
        }
      })
    this.viewer.on(ViewerEvent.LoadComplete, () => {
      this.updateViewModeOptions(this._viewModeOptions)
    })
  }

  public on<T extends ViewModeEvent>(
    eventType: T,
    listener: (arg: ViewModeEventPayload[T]) => void
  ): void {
    super.on(eventType, listener)
  }

  public setViewMode(viewMode: ViewMode, options?: ViewModeOptions) {
    /** Edges on/off require pipeline rebuild */
    if (
      viewMode !== this._viewMode ||
      (options && options.edges !== this._viewModeOptions.edges)
    ) {
      this._viewMode = viewMode
      this.updateViewModes(viewMode, options)
    } else {
      this.updateViewModeOptions(options)
    }
    Object.assign(this._viewModeOptions, options)
  }

  protected updateViewModes(viewMode: ViewMode, options?: ViewModeOptions) {
    const renderer = this.viewer.getRenderer()
    switch (viewMode) {
      case ViewMode.DEFAULT:
        renderer.pipeline = new DefaultPipeline(renderer, options)
        break
      case ViewMode.PEN:
        renderer.pipeline = new PenViewPipeline(renderer, options)
        break
      case ViewMode.SOLID:
        renderer.pipeline = new SolidViewPipeline(renderer, options)
        break
      case ViewMode.ARCTIC:
        renderer.pipeline = new ArcticViewPipeline(renderer, options)
        break
      case ViewMode.SHADED:
        renderer.pipeline = new ShadedViewPipeline(
          renderer,
          options,
          this.viewer.getWorldTree()
        )
        break
    }
    this.updateViewModeOptions(options)
    this.viewer.requestRender(UpdateFlags.RENDER_RESET)
    this.emit(ViewModeEvent.Changed, viewMode)
  }

  protected updateViewModeOptions(options?: ViewModeOptions) {
    if (!options) return
    const relativeDepthBias = this.viewer.World.getRelativeOffset(
      DefaultEdgesPassOptions.depthBias
    )
    const edgesPasses = this.viewer.getRenderer().pipeline.getPass('EDGES')
    edgesPasses.forEach((pass: GPass) => {
      pass.options = { ...options, depthBias: relativeDepthBias }
    })
    this.viewer.requestRender(UpdateFlags.RENDER_RESET)
  }
}
