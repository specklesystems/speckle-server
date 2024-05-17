import type { MaybeRef } from '@vueuse/core'
import {
  useProjectAutomationsUpdateTracking,
  useProjectTriggeredAutomationsStatusUpdateTracking
} from '~/lib/projects/composables/automationManagement'
import { useSynchronizedCookie } from '~~/lib/common/composables/reactiveCookie'
import { GridListToggleValue } from '~~/lib/layout/helpers/components'
import {
  useProjectModelUpdateTracking,
  useProjectPendingModelUpdateTracking
} from '~~/lib/projects/composables/modelManagement'
import { useProjectUpdateTracking } from '~~/lib/projects/composables/projectManagement'
import {
  useProjectPendingVersionUpdateTracking,
  useProjectVersionUpdateTracking
} from '~~/lib/projects/composables/versionManagement'

export function useProjectPageItemViewType(contentType: string) {
  const viewTypeCookie = useSynchronizedCookie(`projectPage-${contentType}-viewType`)
  const gridOrList = computed({
    get: () =>
      viewTypeCookie.value === GridListToggleValue.Grid
        ? GridListToggleValue.Grid
        : GridListToggleValue.List,
    set: (newVal) => {
      viewTypeCookie.value = newVal
    }
  })

  return gridOrList
}

/**
 * Invoke this in any of the project pages/subpages to ensure we track realtime updates
 * to the project, its versions and/or models
 */
export function useGeneralProjectPageUpdateTracking(
  params: {
    projectId: MaybeRef<string>
  },
  options?: Partial<{
    notifyOnProjectUpdate: boolean
    redirectHomeOnProjectDeletion: boolean
    redirectToProjectOnModelDeletion: (modelId: string) => boolean
  }>
) {
  const projectId = computed(() => unref(params.projectId))

  // Project updates + redirect away if project deleted
  useProjectUpdateTracking(projectId, undefined, {
    redirectOnDeletion: options?.redirectHomeOnProjectDeletion ?? true,
    notifyOnUpdate: options?.notifyOnProjectUpdate
  })

  // Project model update tracking
  useProjectModelUpdateTracking(projectId, undefined, {
    redirectToProjectOnModelDeletion: options?.redirectToProjectOnModelDeletion
  })

  // Project version update tracking (e.g. updating model previews, showing new version toast)
  useProjectVersionUpdateTracking(projectId)

  // FILE IMPORTS:
  // Pending model & version update tracking
  useProjectPendingVersionUpdateTracking(projectId)
  useProjectPendingModelUpdateTracking(projectId)

  // AUTOMATIONS:
  useProjectTriggeredAutomationsStatusUpdateTracking({ projectId })
  useProjectAutomationsUpdateTracking({ projectId })
}
