import { ModifierKeys } from '@speckle/ui-components'

export const ViewerShortcuts = {
  ToggleModels: {
    name: 'Models',
    description: 'Toggle models panel',
    modifiers: [ModifierKeys.Shift],
    key: 'M',
    action: 'toggleModels'
  },
  ToggleExplorer: {
    name: 'Scene explorer',
    description: 'Toggle scene explorer panel',
    modifiers: [ModifierKeys.Shift],
    key: 'E',
    action: 'toggleExplorer'
  },
  ToggleDiscussions: {
    name: 'Discussions',
    description: 'Toggle discussions panel',
    modifiers: [ModifierKeys.Shift],
    key: 'D',
    action: 'toggleDiscussions'
  },
  ToggleMeasurements: {
    name: 'Measure',
    description: 'Toggle measurement mode',
    modifiers: [ModifierKeys.Shift],
    key: 'R',
    action: 'toggleMeasurements'
  },
  ToggleProjection: {
    name: 'Projection',
    description: 'Toggle between orthographic and perspective projection',
    modifiers: [ModifierKeys.Shift],
    key: 'P',
    action: 'toggleProjection'
  },
  ToggleSectionBox: {
    name: 'Section',
    description: 'Toggle section box',
    modifiers: [ModifierKeys.Shift],
    key: 'B',
    action: 'toggleSectionBox'
  },
  ZoomExtentsOrSelection: {
    name: 'Fit',
    description: 'Zoom to fit selection or entire model',
    modifiers: [ModifierKeys.Shift],
    key: 'space',
    action: 'zoomExtentsOrSelection'
  },
  ToggleViews: {
    name: 'Views',
    description: 'Toggle views panel',
    modifiers: [ModifierKeys.Shift],
    key: 'V',
    action: 'toggleViews'
  },
  ToggleViewModes: {
    name: 'View modes',
    description: 'Toggle view modes panel',
    modifiers: [ModifierKeys.Shift],
    key: 'C',
    action: 'toggleViewModes'
  },
  SetViewModeDefault: {
    name: 'Default View Mode',
    description: 'Set view mode to Default',
    modifiers: [ModifierKeys.Shift],
    key: 'Digit1',
    action: 'setViewModeDefault'
  },
  SetViewModeDefaultEdges: {
    name: 'Default + Edges View Mode',
    description: 'Set view mode to Default + Edges',
    modifiers: [ModifierKeys.Shift],
    key: 'Digit2',
    action: 'setViewModeDefaultEdges'
  },
  SetViewModeShaded: {
    name: 'Shaded View Mode',
    description: 'Set view mode to Shaded',
    modifiers: [ModifierKeys.Shift],
    key: 'Digit3',
    action: 'setViewModeShaded'
  },
  SetViewModePen: {
    name: 'Pen View Mode',
    description: 'Set view mode to Pen',
    modifiers: [ModifierKeys.Shift],
    key: 'Digit4',
    action: 'setViewModePen'
  },
  SetViewModeArctic: {
    name: 'Arctic View Mode',
    description: 'Set view mode to Arctic',
    modifiers: [ModifierKeys.Shift],
    key: 'Digit5',
    action: 'setViewModeArctic'
  }
} as const

export type ViewerShortcutAction = keyof typeof ViewerShortcuts
