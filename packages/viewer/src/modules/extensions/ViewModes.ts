import { IViewer, UpdateFlags, ViewerEvent } from '../../IViewer.js'
import { ShadedPass } from '../pipeline/Passes/ShadedPass.js'
import { GPass } from '../pipeline/Passes/GPass.js'
import { ArcticViewPipeline } from '../pipeline/Pipelines/ArcticViewPipeline.js'
import { BasitPipeline } from '../pipeline/Pipelines/BasitViewPipeline.js'
import { DefaultPipeline } from '../pipeline/Pipelines/DefaultPipeline.js'
import { PenViewPipeline } from '../pipeline/Pipelines/PenViewPipeline.js'
import { ShadedViewPipeline } from '../pipeline/Pipelines/ShadedViewPipeline.js'
import { Extension } from './Extension.js'
import { FilteringExtension, FilteringState } from './FilteringExtension.js'

export enum ViewMode {
  DEFAULT,
  SHADED,
  PEN,
  ARCTIC,
  COLORS
}

export enum ViewModeEvent {
  Changed = 'view-mode-changed'
}

export interface ViewModeEventPayload {
  [ViewModeEvent.Changed]: ViewMode
}

export class ViewModes extends Extension {
  public get inject() {
    return [FilteringExtension]
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
          /** If any basit pass exists, set it's required color indices */
          this.viewer
            .getRenderer()
            .pipeline.getPass('BASIT')
            .forEach((pass: GPass) => {
              ;(pass as ShadedPass).applyColorIndices()
            })
        }
      })
  }

  public on<T extends ViewModeEvent>(
    eventType: T,
    listener: (arg: ViewModeEventPayload[T]) => void
  ): void {
    super.on(eventType, listener)
  }

  public setViewMode(viewMode: ViewMode) {
    const renderer = this.viewer.getRenderer()
    switch (viewMode) {
      case ViewMode.DEFAULT:
        renderer.pipeline = new DefaultPipeline(renderer)
        break

      case ViewMode.PEN:
        renderer.pipeline = new PenViewPipeline(renderer)
        break
      case ViewMode.SHADED:
        renderer.pipeline = new ShadedViewPipeline(renderer)
        break
      case ViewMode.ARCTIC:
        renderer.pipeline = new ArcticViewPipeline(renderer)
        break
      case ViewMode.COLORS:
        renderer.pipeline = new BasitPipeline(renderer, this.viewer.getWorldTree())
        break
    }
    this.viewer.requestRender(UpdateFlags.RENDER_RESET)

    this.emit(ViewModeEvent.Changed, viewMode)
  }
}
