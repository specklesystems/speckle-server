import { ModifierKeys } from '@speckle/ui-components'
import { ViewMode } from '@speckle/viewer'

export const ViewModeShortcuts = {
  SetViewModeDefault: {
    name: 'Default',
    description: 'Set view mode to Default',
    modifiers: [ModifierKeys.Shift],
    key: 'Digit1',
    action: 'SetViewModeDefault',
    viewMode: ViewMode.DEFAULT
  },
  SetViewModeDefaultEdges: {
    name: 'Default + Edges',
    description: 'Set view mode to Default + Edges',
    modifiers: [ModifierKeys.Shift],
    key: 'Digit2',
    action: 'SetViewModeDefaultEdges',
    viewMode: ViewMode.DEFAULT_EDGES
  },
  SetViewModeShaded: {
    name: 'Shaded',
    description: 'Set view mode to Shaded',
    modifiers: [ModifierKeys.Shift],
    key: 'Digit3',
    action: 'SetViewModeShaded',
    viewMode: ViewMode.SHADED
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
  }
} as const

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

export const ViewerShortcuts = {
  ...ViewModeShortcuts,
  ...PanelShortcuts,
  ...ToolShortcuts
} as const
