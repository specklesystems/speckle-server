import { useInjectedViewerState } from '~/lib/viewer/composables/setup'
import { ModelsSubView, type ActivePanel } from '~/lib/viewer/helpers/sceneExplorer'

export const useViewerPanelsSetup = () => {
  const active = ref<ActivePanel>('none')
  const modelsSubView = ref<ModelsSubView>(ModelsSubView.Main)

  watch(active, (newVal, oldVal) => {
    if (newVal === 'models' && oldVal !== 'models') {
      if (modelsSubView.value !== ModelsSubView.Main) {
        modelsSubView.value = ModelsSubView.Main // reset subview on models open
      }
    }
  })

  return {
    active,
    modelsSubView
  }
}

export const useViewerPanelsUtilities = () => {
  const {
    ui: {
      panels: { modelsSubView, active: activePanel }
    }
  } = useInjectedViewerState()

  /**
   * Instead of just setting the panel, toggle it according to the rules we have for the panel buttons
   */
  const onPanelButtonClick = (newPanel: ActivePanel) => {
    // Simple logic for most panels
    if (newPanel !== 'models') {
      activePanel.value = activePanel.value === newPanel ? 'none' : newPanel
      modelsSubView.value = ModelsSubView.Main
      return
    }

    // Special logic if clicking the Models panel
    const currentlyInModels = activePanel.value === 'models'
    const inSpecialSubView =
      modelsSubView.value === ModelsSubView.Versions ||
      modelsSubView.value === ModelsSubView.Diff

    if (!currentlyInModels) {
      // Open models panel and reset to main view
      activePanel.value = 'models'
      modelsSubView.value = ModelsSubView.Main
      return
    }

    if (inSpecialSubView) {
      // Go back to main models view instead of closing
      modelsSubView.value = ModelsSubView.Main
      return
    }

    // Just close the panel
    activePanel.value = 'none'
  }

  return {
    onPanelButtonClick
  }
}
