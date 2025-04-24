import { ModifierKeys } from '@speckle/ui-components'
import { ViewMode } from '@speckle/viewer'

export const PanelShortcuts = {
  ToggleModels: {
    name: 'Models',
    description: 'Toggle models panel',
    modifiers: [ModifierKeys.Shift],
    key: 'M',
    action: 'ToggleModels'
  },
  ToggleExplorer: {
    name: 'Scene explorer',
    description: 'Toggle scene explorer panel',
    modifiers: [ModifierKeys.Shift],
    key: 'E',
    action: 'ToggleExplorer'
  },
  ToggleDiscussions: {
    name: 'Discussions',
    description: 'Toggle discussions panel',
    modifiers: [ModifierKeys.Shift],
    key: 'D',
    action: 'ToggleDiscussions'
  }
} as const

export const ToolShortcuts = {
  ToggleMeasurements: {
    name: 'Measure',
    description: 'Toggle measurement mode',
    modifiers: [ModifierKeys.Shift],
    key: 'R',
    action: 'ToggleMeasurements'
  },
  ToggleProjection: {
    name: 'Projection',
    description: 'Toggle between orthographic and perspective projection',
    modifiers: [ModifierKeys.Shift],
    key: 'P',
    action: 'ToggleProjection'
  },
  ToggleSectionBox: {
    name: 'Section',
    description: 'Toggle section box',
    modifiers: [ModifierKeys.Shift],
    key: 'B',
    action: 'ToggleSectionBox'
  },
  ZoomExtentsOrSelection: {
    name: 'Fit',
    description: 'Zoom to fit selection or entire model',
    modifiers: [ModifierKeys.Shift],
    key: 'space',
    action: 'ZoomExtentsOrSelection'
  }
} as const

export const ViewModeShortcuts = {
  SetViewModeDefault: {
    name: 'Rendered',
    description: 'Set view mode to Rendered',
    modifiers: [ModifierKeys.Shift],
    key: 'Digit1',
    action: 'SetViewModeDefault',
    viewMode: ViewMode.DEFAULT
  },
  SetViewModeSolid: {
    name: 'Solid',
    description: 'Set view mode to Solid',
    modifiers: [ModifierKeys.Shift],
    key: 'Digit3',
    action: 'SetViewModeShaded',
    viewMode: ViewMode.SOLID
  },
  SetViewModePen: {
    name: 'Pen',
    description: 'Set view mode to Pen',
    modifiers: [ModifierKeys.Shift],
    key: 'Digit4',
    action: 'SetViewModePen',
    viewMode: ViewMode.PEN
  },
  SetViewModeArctic: {
    name: 'Arctic',
    description: 'Set view mode to Arctic',
    modifiers: [ModifierKeys.Shift],
    key: 'Digit5',
    action: 'SetViewModeArctic',
    viewMode: ViewMode.ARCTIC
  },
  SetViewModeShaded: {
    name: 'Shaded',
    description: 'Set view mode to Shaded',
    modifiers: [ModifierKeys.Shift],
    key: 'Digit6',
    action: 'SetViewModeColors',
    viewMode: ViewMode.SHADED
  }
} as const

export const ViewShortcuts = {
  SetViewTop: {
    name: 'Top',
    description: 'Set view to Top',
    modifiers: [ModifierKeys.AltOrOpt],
    key: 'Digit1',
    action: 'SetViewTop'
  },
  SetViewFront: {
    name: 'Front',
    description: 'Set view to Front',
    modifiers: [ModifierKeys.AltOrOpt],
    key: 'Digit2',
    action: 'SetViewFront'
  },
  SetViewLeft: {
    name: 'Left',
    description: 'Set view to Left',
    modifiers: [ModifierKeys.AltOrOpt],
    key: 'Digit3',
    action: 'SetViewLeft'
  },
  SetViewBack: {
    name: 'Back',
    description: 'Set view to Back',
    modifiers: [ModifierKeys.AltOrOpt],
    key: 'Digit4',
    action: 'SetViewBack'
  },
  SetViewRight: {
    name: 'Right',
    description: 'Set view to Right',
    modifiers: [ModifierKeys.AltOrOpt],
    key: 'Digit5',
    action: 'SetViewRight'
  }
} as const

export const ViewerShortcuts = {
  ...ViewModeShortcuts,
  ...PanelShortcuts,
  ...ToolShortcuts,
  ...ViewShortcuts
} as const
