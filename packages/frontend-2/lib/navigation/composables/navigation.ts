import { setActiveWorkspaceMutation } from '~/lib/navigation/graphql/mutations'
import { useMutation } from '@vue/apollo-composable'

export const useNavigationState = () =>
  useState<{
    activeWorkspaceSlug: string | null
    isProjectsActive: boolean
  }>('navigation-state', () => ({
    activeWorkspaceSlug: null,
    isProjectsActive: false
  }))

export const useNavigation = () => {
  const state = useNavigationState()
  const { mutate } = useMutation(setActiveWorkspaceMutation)
  const $intercom = useIntercom()

  const activeWorkspaceSlug = computed({
    get: () => state.value.activeWorkspaceSlug,
    set: (newVal) => (state.value.activeWorkspaceSlug = newVal)
  })

  const isProjectsActive = computed({
    get: () => state.value.isProjectsActive,
    set: (newVal) => (state.value.isProjectsActive = newVal)
  })

  const mutateActiveWorkspaceSlug = async (newVal: string | null) => {
    state.value.activeWorkspaceSlug = newVal
    state.value.isProjectsActive = false
    await mutate({ slug: newVal, isProjectsActive: false })
    $intercom.updateCompany()
  }

  const mutateIsProjectsActive = async (isActive: boolean) => {
    state.value.isProjectsActive = isActive
    state.value.activeWorkspaceSlug = null
    await mutate({ isProjectsActive: state.value.isProjectsActive, slug: null })
  }

  return {
    activeWorkspaceSlug,
    isProjectsActive,
    mutateActiveWorkspaceSlug,
    mutateIsProjectsActive
  }
}
