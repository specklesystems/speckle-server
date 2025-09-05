import { useOnViewerLoadComplete } from '~~/lib/viewer/composables/viewer'
import { useFilteringDataStore } from '~/lib/viewer/composables/filtering/dataStore'
import { useInjectedViewerState } from '~~/lib/viewer/composables/setup'
import { resourceBuilder } from '@speckle/shared/viewer/route'

/**
 * One-time setup for filtering system
 */
export function useFilteringSetup() {
  const state = useInjectedViewerState()
  const {
    viewer: { instance }
  } = state
  const { resourceItems } = state.resources.response
  const { resourceIdString } = state.resources.request

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

  watch(resourceIdString, async (newResourceString, oldResourceString) => {
    if (newResourceString && oldResourceString) {
      if (
        !resourceBuilder().addResources(newResourceString).isEqualTo(oldResourceString)
      ) {
        await populateInternalDataStore()
      }
    } else if (newResourceString) {
      await populateInternalDataStore()
    }
  })

  return {
    populateInternalDataStore
  }
}
