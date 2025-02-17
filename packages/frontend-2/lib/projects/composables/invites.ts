import { useMixpanel } from '~/lib/core/composables/mp'
import { useProcessProjectInvite } from '~/lib/projects/composables/projectManagement'

export const useProjectInviteManager = () => {
  const processInvite = useProcessProjectInvite()
  const mp = useMixpanel()

  const loading = ref(false)

  const useInvite = async (params: {
    accept: boolean
    token: string
    projectId: string
    inviteId?: string
  }) => {
    const { token, accept, projectId, inviteId } = params
    if (!token?.length || !projectId?.length) return false

    loading.value = true
    const success = await processInvite(
      {
        projectId,
        accept,
        token
      },
      { inviteId }
    )
    loading.value = false

    if (!success) return false

    mp.track('Invite Action', {
      type: 'project invite',
      accepted: accept
    })

    return !!success
  }

  return {
    useInvite,
    loading: computed(() => loading.value)
  }
}
