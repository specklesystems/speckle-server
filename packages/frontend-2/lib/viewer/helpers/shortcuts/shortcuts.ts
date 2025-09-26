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
  ToggleFilters: {
    name: 'Filters',
    description: 'Toggle filters panel',
    modifiers: [ModifierKeys.Shift],
    key: 'F',
    action: 'ToggleFilters'
  },
  ToggleDiscussions: {
    name: 'Discussions',
    description: 'Toggle discussions panel',
    modifiers: [ModifierKeys.Shift],
    key: 'D',
    action: 'ToggleDiscussions'
  },
  ToggleDevMode: {
    name: 'Dev Mode',
    description: 'Toggle dev mode',
    modifiers: [ModifierKeys.Shift],
    key: 'X',
    action: 'ToggleDevMode'
  },
  ToggleSavedViews: {
    name: 'Saved views',
    description: 'Toggle saved views panel',
    modifiers: [ModifierKeys.Shift],
    key: 'S',
    action: 'ToggleSavedViews'
  },
  ToggleViewModes: {
    name: 'View modes',
    description: 'Toggle view modes panel',
    modifiers: [ModifierKeys.Shift],
    key: 'V',
    action: 'ToggleViewModes'
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
  ToggleExplode: {
    name: 'Explode',
    description: 'Toggle explode mode',
    modifiers: [ModifierKeys.Shift],
    key: 'E',
    action: 'ToggleExplode'
  },
  ZoomExtentsOrSelection: {
    name: 'Fit',
    description: 'Zoom to fit selection or entire model',
    modifiers: [ModifierKeys.Shift],
    key: 'space',
    action: 'ZoomExtentsOrSelection'
  },
  ToggleLightControls: {
    name: 'Light controls',
    description: 'Toggle light controls panel',
    modifiers: [ModifierKeys.Shift],
    key: 'L',
    action: 'ToggleLightControls'
  }
} as const

export const ViewModeShortcuts = {
  SetViewModeDefault: {
    name: 'Rendered',
    description:
      'A realistic view of your model rendered with available materials for surfaces.',
    modifiers: [ModifierKeys.Shift],
    key: 'Digit1',
    action: 'SetViewModeDefault',
    viewMode: ViewMode.DEFAULT
  },
  SetViewModeShaded: {
    name: 'Shaded',
    description:
      'A shaded view of your model using available colors for surfaces and curves.',
    modifiers: [ModifierKeys.Shift],
    key: 'Digit2',
    action: 'SetViewModeShaded',
    viewMode: ViewMode.SHADED
  },
  SetViewModeArctic: {
    name: 'Arctic',
    description:
      'A white conceptual view of your model without any materials or colors.',
    modifiers: [ModifierKeys.Shift],
    key: 'Digit3',
    action: 'SetViewModeArctic',
    viewMode: ViewMode.ARCTIC
  },
  SetViewModeSolid: {
    name: 'Solid',
    description:
      'A basic shaded view of your model using our default material, with edges.',
    modifiers: [ModifierKeys.Shift],
    key: 'Digit4',
    action: 'SetViewModeSolid',
    viewMode: ViewMode.SOLID
  },
  SetViewModePen: {
    name: 'Pen',
    description:
      'A stylized black and white drawing view of your model, without any lighting or shadows.',
    modifiers: [ModifierKeys.Shift],
    key: 'Digit5',
    action: 'SetViewModePen',
    viewMode: ViewMode.PEN
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
