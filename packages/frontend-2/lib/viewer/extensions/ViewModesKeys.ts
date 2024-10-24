import {
  Extension,
  InputEvent,
  ViewMode,
  ViewModes,
  type IViewer
} from '@speckle/viewer'

export class ViewModesKeys extends Extension {
  public get inject() {
    return [ViewModes]
  }

  constructor(viewer: IViewer, protected viewModes: ViewModes) {
    super(viewer)
    const renderer = viewer.getRenderer()
    renderer.input.on(InputEvent.KeyUp, (arg: KeyboardEvent) => {
      switch (arg.key) {
        case '1':
          viewModes.setViewMode(ViewMode.DEFAULT)
          break
        case '2':
          viewModes.setViewMode(ViewMode.DEFAULT_EDGES)
          break
        case '3':
          viewModes.setViewMode(ViewMode.SHADED)
          break
        case '4':
          viewModes.setViewMode(ViewMode.PEN)
          break
        case '5':
          viewModes.setViewMode(ViewMode.ARCTIC)
          break
      }
    })
  }
}
