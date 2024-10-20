import type { Survicate } from '@survicate/survicate-web-surveys-wrapper'
import type { Nullable } from '@speckle/shared'
import { useOnAuthStateChange } from '~/lib/auth/composables/auth'

export default defineNuxtPlugin(async () => {
  let survicateInstance = null as Nullable<Survicate>

  const {
    public: { survicateWorkspaceKey }
  } = useRuntimeConfig()

  const logger = useLogger()
  const onAuthStateChange = useOnAuthStateChange()
  const { isLoggedIn } = useActiveUser()
  const route = useRoute()

  const isAuthVerifyPage = computed(() => route.name === 'authorize-app')

  if (!survicateWorkspaceKey?.length || !isLoggedIn.value || isAuthVerifyPage.value) {
    return {
      provide: {
        survicate: survicateInstance
      }
    }
  }

  try {
    const { initSurvicate, getSurvicateInstance } = await import(
      '@survicate/survicate-web-surveys-wrapper/widget_wrapper'
    )

    // Skip await, cause the survicate codebase stupidly does not handle adblock preventing their script from being loaded
    // which causes this promise to never resolve (or reject!)
    // Thus we're initializing survicate asynchronously and letting the plugin (& the app) finish running before that happens
    void initSurvicate({ workspaceKey: survicateWorkspaceKey })
      .then(async () => {
        survicateInstance = getSurvicateInstance()

        if (!survicateInstance) {
          throw new Error('Survicate instance is not available after initialization.')
        }

        // Handle authentication state changes
        await onAuthStateChange(
          (user, { resolveDistinctId }) => {
            const distinctId = resolveDistinctId(user)
            if (distinctId && survicateInstance) {
              // eslint-disable-next-line camelcase
              survicateInstance.setVisitorTraits({ user_id: distinctId, distinctId })
            }
          },
          { immediate: true }
        )

        //Send NPS event
        survicateInstance.invokeEvent('nps-survey')
      })
      .catch(logger.error)
  } catch (error) {
    logger.error('Survicate failed to load:', error)
  }

  return {
    provide: {
      survicate: survicateInstance
    }
  }
})
