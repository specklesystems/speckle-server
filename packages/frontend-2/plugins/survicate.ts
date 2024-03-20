import {
  useOnAuthStateChange,
  useGetInitialAuthState
} from '~/lib/auth/composables/auth'
import { useSynchronizedCookie } from '~/lib/common/composables/reactiveCookie'
import dayjs from 'dayjs'

export default defineNuxtPlugin(async (app) => {
  const onboardingOrFeedbackDateString = useSynchronizedCookie<string | undefined>(
    'onboardingOrFeedbackDate',
    {
      default: () => new Date().toISOString().split('T')[0],
      expires: dayjs().add(180, 'day').toDate() // cookie expiration set to 180 days from now
    }
  )

  const onboardingOrFeedbackDate = onboardingOrFeedbackDateString.value
    ? new Date(onboardingOrFeedbackDateString.value)
    : new Date()

  const shouldShowSurvey = checkSurveyDisplayConditions(onboardingOrFeedbackDate)

  if (process.client && shouldShowSurvey) {
    const {
      public: { survicateWorkspaceKey, survicateSurveyId }
    } = useRuntimeConfig()

    const logger = useLogger()
    const initUser = useGetInitialAuthState()
    const onAuthStateChange = useOnAuthStateChange()

    try {
      const { initSurvicate, getSurvicateInstance } = await import(
        '@survicate/survicate-web-surveys-wrapper/widget_wrapper'
      )
      await initSurvicate({ workspaceKey: survicateWorkspaceKey })
      const survicateInstance = getSurvicateInstance()

      if (!survicateInstance) {
        throw new Error('Survicate instance is not available after initialization.')
      }

      const { distinctId } = await initUser()

      if (distinctId) {
        survicateInstance.setVisitorTraits({ distinctId })
      }

      // Handle authentication state changes
      await onAuthStateChange(
        (user, { resolveDistinctId }) => {
          const distinctId = resolveDistinctId(user)
          if (distinctId) {
            survicateInstance.setVisitorTraits({ distinctId })
          }
        },
        { immediate: false }
      )

      survicateInstance.showSurvey(survicateSurveyId as string, {
        forceDisplay: true
      })

      app.provide('survicate', survicateInstance)
    } catch (error) {
      logger.error('Survicate failed to load:', error)
      app.provide('survicate', null)
    }
  }
})

function checkSurveyDisplayConditions(onboardingOrFeedbackDate: Date): boolean {
  const threeDaysAfterOnboarding = dayjs(onboardingOrFeedbackDate).add(3, 'day')
  return dayjs().isAfter(threeDaysAfterOnboarding)
}
