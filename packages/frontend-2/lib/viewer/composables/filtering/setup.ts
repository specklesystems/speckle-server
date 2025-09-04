import { useOnViewerLoadComplete } from '~~/lib/viewer/composables/viewer'
import { useFilteringDataStore } from '~/lib/viewer/composables/filtering/dataStore'
import { useInjectedViewerState } from '~~/lib/viewer/composables/setup'

/**
 * One-time setup for filtering system
 */
export function useFilteringSetup() {
  const state = useInjectedViewerState()
  const {
    viewer: { instance }
  } = state
  const { resourceItems } = state.resources.response

  const dataStore = useFilteringDataStore()

  const populateInternalDataStore = async () => {
    const tree = instance.getWorldTree()
    if (!tree || !resourceItems.value.length) {
      return
    }

    const availableResources = resourceItems.value.filter((item) => {
      const nodes = tree.findId(item.objectId)
      return nodes && nodes.length > 0
    })

    if (availableResources.length === 0) {
      return
    }

    dataStore.clearDataOnRouteLeave()

    const resources = availableResources.map((item) => ({
      resourceUrl: item.objectId
    }))

    await dataStore.populateDataStore(instance, resources)
  }

  useOnViewerLoadComplete(async () => {
    await populateInternalDataStore()
  })

  watch(
    resourceItems,
    async (newResourceItems, oldResourceItems) => {
      if (newResourceItems.length > 0 && newResourceItems !== oldResourceItems) {
        await populateInternalDataStore()
      }
    },
    { deep: true }
  )

  return {
    populateInternalDataStore
  }
}
