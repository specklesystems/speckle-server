import type { AccUserInfo } from '@speckle/shared/acc'

export function useAccUser() {
  const { triggerNotification } = useGlobalToast()

  const loadingUser = ref(false)
  const userInfo = ref<AccUserInfo>()

  const fetchUserInfo = async (token: string) => {
    loadingUser.value = true
    try {
      const res = await fetch(
        'https://developer.api.autodesk.com/userprofile/v1/users/@me',
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (!res.ok) throw new Error('Failed to get user info directly from ACC')
      userInfo.value = await res.json()
    } catch (error) {
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: 'Error fetching user info directly',
        description: error instanceof Error ? error.message : 'Unexpected error'
      })
    } finally {
      loadingUser.value = false
    }
  }

  return {
    loadingUser,
    userInfo,
    fetchUserInfo
  }
}
