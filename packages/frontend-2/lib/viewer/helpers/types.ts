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
    key: 'T',
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
    key: 'D',
    action: 'toggleViewModes'
  }
} as const

export type ViewerShortcutAction = keyof typeof ViewerShortcuts
