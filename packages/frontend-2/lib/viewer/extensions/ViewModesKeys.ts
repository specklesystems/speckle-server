import {
  ArcticViewPipeline,
  DefaultPipeline,
  EdgesPipeline,
  Extension,
  InputEvent,
  PenViewPipeline,
  ShadedViewPipeline,
  UpdateFlags,
  type IViewer
} from '@speckle/viewer'

export class ViewModesKeys extends Extension {
  constructor(viewer: IViewer) {
    super(viewer)
    const renderer = viewer.getRenderer()
    renderer.input.on(InputEvent.KeyUp, (arg: KeyboardEvent) => {
      switch (arg.key) {
        case '1':
          renderer.pipeline = new DefaultPipeline(renderer)
          break
        case '2':
          renderer.pipeline = new EdgesPipeline(renderer)
          break
        case '3':
          renderer.pipeline = new ShadedViewPipeline(renderer)
          break
        case '4':
          renderer.pipeline = new PenViewPipeline(renderer)
          break
        case '5':
          renderer.pipeline = new ArcticViewPipeline(renderer)
          break
      }
      this.viewer.resize()
      this.viewer.requestRender(UpdateFlags.RENDER_RESET)
    })
  }
}
