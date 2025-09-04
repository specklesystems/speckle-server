import { FilteringExtension } from '@speckle/viewer'
import { watchTriggerable } from '@vueuse/core'
import { useInjectedViewerState } from '~/lib/viewer/composables/setup'
import { useOnViewerLoadComplete } from '~/lib/viewer/composables/viewer'

/**
 * Integration composable for manual object isolation and hiding.
 */
export const useManualFilteringPostSetup = () => {
  const {
    ui: { filters },
    viewer: { instance }
  } = useInjectedViewerState()

  const filteringExtension = () => instance.getExtension(FilteringExtension)

  /**
   * Watch for changes to manually isolated object IDs
   */
  const { trigger: triggerIsolationWatch } = watchTriggerable(
    filters.isolatedObjectIds,
    (newIds, oldIds) => {
      if (!newIds || !oldIds) return

      const extension = filteringExtension()

      const toIsolate = newIds.filter((id) => !oldIds.includes(id))
      if (toIsolate.length > 0) {
        extension.isolateObjects(toIsolate, 'manual-isolation', true, true)
      }

      const toUnIsolate = oldIds.filter((id) => !newIds.includes(id))
      if (toUnIsolate.length > 0) {
        extension.unIsolateObjects(toUnIsolate, 'manual-isolation', true, true)
      }
    },
    { deep: true }
  )

  /**
   * Watch for changes to manually hidden object IDs
   */
  const { trigger: triggerHidingWatch } = watchTriggerable(
    filters.hiddenObjectIds,
    (newIds, oldIds) => {
      if (!newIds || !oldIds) return

      const extension = filteringExtension()

      const toHide = newIds.filter((id) => !oldIds.includes(id))
      if (toHide.length > 0) {
        extension.hideObjects(toHide, 'manual-hiding', false, false)
      }

      const toShow = oldIds.filter((id) => !newIds.includes(id))
      if (toShow.length > 0) {
        extension.showObjects(toShow, 'manual-hiding', false)
      }
    },
    { deep: true }
  )

  /**
   * Initialize manual filtering on viewer load
   */
  useOnViewerLoadComplete(
    () => {
      triggerIsolationWatch()
      triggerHidingWatch()
    },
    { initialOnly: true }
  )

  onBeforeUnmount(() => {
    const extension = filteringExtension()
    if (filters.isolatedObjectIds.value.length > 0) {
      extension.unIsolateObjects(
        filters.isolatedObjectIds.value,
        'manual-isolation',
        true,
        true
      )
    }
    if (filters.hiddenObjectIds.value.length > 0) {
      extension.showObjects(filters.hiddenObjectIds.value, 'manual-hiding', false)
    }
  })
}
