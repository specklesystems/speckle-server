/* eslint-disable @typescript-eslint/no-explicit-any */
import type { MaybeAsync, MaybeNullOrUndefined } from '@speckle/shared'
import { useQuery } from '@vue/apollo-composable'
import { graphql } from '~/lib/common/generated/gql'
import type { WorkspaceHasCustomDataResidency_WorkspaceFragment } from '~/lib/common/generated/gql/graphql'

export enum RegionStaticDataDisclaimerVariant {
  MoveProjectIntoWorkspace = 'MoveProjectIntoWorkspace'
}

graphql(`
  fragment WorkspaceHasCustomDataResidency_Workspace on Workspace {
    id
    defaultRegion {
      id
      name
    }
  }
`)

const checkProjectWorkspaceDataResidencyQuery = graphql(`
  query CheckProjectWorkspaceDataResidency($projectId: String!) {
    project(id: $projectId) {
      id
      workspace {
        ...WorkspaceHasCustomDataResidency_Workspace
      }
    }
  }
`)

export const useWorkspaceCustomDataResidencyDisclaimer = <
  ConfirmArgs extends any[]
>(params: {
  workspace: Ref<
    MaybeNullOrUndefined<WorkspaceHasCustomDataResidency_WorkspaceFragment>
  >
  onConfirmAction: (...args: ConfirmArgs) => MaybeAsync<void>
}) => {
  const { onConfirmAction, workspace } = params
  const isWorkspacesMultiRegionBlobStorageEnabled =
    useIsWorkspacesMultiRegionBlobStorageEnabled()
  const showRegionStaticDataDisclaimer = ref(false)
  const storedArgs = shallowRef<ConfirmArgs>()

  const hasCustomDataResidency = computed(() => {
    return !!workspace.value?.defaultRegion
  })

  /**
   * Trigger the actual action that requires the user to confirm the data residency disclaimer
   */
  const triggerAction = (...args: ConfirmArgs) => {
    if (!hasCustomDataResidency.value || isWorkspacesMultiRegionBlobStorageEnabled) {
      onConfirmAction(...args)
    } else {
      storedArgs.value = args
      showRegionStaticDataDisclaimer.value = true
    }
  }

  /**
   * Disclaimer on-confirm handler
   */
  const onConfirmHandler = () => {
    showRegionStaticDataDisclaimer.value = false
    onConfirmAction(...storedArgs.value!)
  }

  return {
    hasCustomDataResidency,
    showRegionStaticDataDisclaimer,
    triggerAction,
    onConfirmHandler
  }
}

export const useWorkspaceCustomDataResidencyDisclaimerQuery = <
  ConfirmArgs extends any[]
>(params: {
  projectId: Ref<string>
  onConfirmAction: (...args: ConfirmArgs) => MaybeAsync<void>
}) => {
  const { projectId, onConfirmAction } = params
  const { result } = useQuery(checkProjectWorkspaceDataResidencyQuery, () => ({
    projectId: projectId.value
  }))

  return useWorkspaceCustomDataResidencyDisclaimer({
    workspace: computed(() => result.value?.project?.workspace),
    onConfirmAction
  })
}
