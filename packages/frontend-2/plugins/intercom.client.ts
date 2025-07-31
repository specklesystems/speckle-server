import { useOnAuthStateChange } from '~/lib/auth/composables/auth'
import Intercom, {
  shutdown,
  show,
  hide,
  update,
  trackEvent
} from '@intercom/messenger-js-sdk'
import type { MaybeNullOrUndefined } from '@speckle/shared'
import { useIntercomEnabled } from '~/lib/intercom/composables/enabled'

export const useIntercom = () => {
  const {
    public: { intercomAppId }
  } = useRuntimeConfig()

  if (!intercomAppId) {
    // Return empty functions if Intercom is not configured
    return {
      show: () => {},
      hide: () => {},
      shutdown: () => {},
      track: () => {},
      updateCompany: () => {}
    }
  }

  const { activeUser: user } = useActiveUser()
  const { isIntercomEnabled, isRouteBlacklisted } = useIntercomEnabled()
  const route = useRoute()

  const isInitialized = ref(false)

  useOnAuthStateChange()(
    (_user, { isReset }) => {
      if (isReset) {
        shutdownIntercom()
      } else if (user.value) {
        bootIntercom()
      }
    },
    { immediate: true }
  )

  const bootIntercom = () => {
    if (
      !isIntercomEnabled.value ||
      isRouteBlacklisted.value ||
      !user.value ||
      isInitialized.value
    )
      return
    isInitialized.value = true

    Intercom({
      /* eslint-disable camelcase */
      app_id: intercomAppId,
      user_id: user.value.id || '',
      created_at: Math.floor(new Date(user.value.createdAt || '').getTime() / 1000),
      /* eslint-enable camelcase */
      name: user.value.name || '',
      email: user.value.email || ''
    })
  }

  const showIntercom = () => {
    if (!isInitialized.value) return
    show()
  }

  const hideIntercom = () => {
    if (!isInitialized.value) return
    hide()
  }

  const shutdownIntercom = () => {
    if (!isInitialized.value) return
    shutdown()
    isInitialized.value = false
  }

  const trackIntercom = (event: string, metadata?: Record<string, unknown>) => {
    if (!isInitialized.value) return
    trackEvent(event, metadata)
  }

  // Update the 'company' (workspace) in Intercom with additional data
  const updateCompany = async (
    data: { id: string } & Record<string, MaybeNullOrUndefined<string>> = { id: '' }
  ) => {
    update({
      company: {
        ...data
      }
    })
  }

  // On route change, check if we need to shutodwn or boot Intercom
  watch(route, () => {
    if (isRouteBlacklisted.value) {
      shutdownIntercom()
    } else {
      bootIntercom()
    }
  })

  return {
    show: showIntercom,
    hide: hideIntercom,
    shutdown: shutdownIntercom,
    track: trackIntercom,
    updateCompany
  }
}

export default defineNuxtPlugin(() => {
  return {
    provide: {
      intercom: useIntercom()
    }
  }
})
