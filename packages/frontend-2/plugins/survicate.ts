import { useOnAuthStateChange } from '~/lib/auth/composables/auth'
import { useSynchronizedCookie } from '~/lib/common/composables/reactiveCookie'
import dayjs from 'dayjs'

export default defineNuxtPlugin(async (app) => {
  if (process.client) {
    const {
      public: { survicateWorkspaceKey, survicateSurveyId }
    } = useRuntimeConfig()

    const logger = useLogger()

    try {
      const { initSurvicate, getSurvicateInstance } = await import(
        '@survicate/survicate-web-surveys-wrapper/widget_wrapper'
      )

      await initSurvicate({ workspaceKey: survicateWorkspaceKey })
      const survicateInstance = getSurvicateInstance()

      if (!survicateInstance) {
        throw new Error('Survicate instance is not available after initialization.')
      }

      const onboardingOrFeedbackDateString = useSynchronizedCookie<string | undefined>(
        'onboardingOrFeedbackDate',
        {
          default: () => new Date().toISOString().split('T')[0],
          expires: dayjs().add(180, 'day').toDate() // cookie expiration set to 180 days from now - to confirm
        }
      )

      // Convert string back to date when checking conditions
      const onboardingOrFeedbackDate = onboardingOrFeedbackDateString.value
        ? new Date(onboardingOrFeedbackDateString.value)
        : new Date()

      const shouldShowSurvey = checkSurveyDisplayConditions(onboardingOrFeedbackDate)

      const onAuthStateChange = useOnAuthStateChange()
      onAuthStateChange(
        (user, { resolveDistinctId }) => {
          const distinctId = resolveDistinctId(user)
          if (distinctId && shouldShowSurvey) {
            survicateInstance.setVisitorTraits({
              distinctId
            })

            // Show the specific survey by ID
            survicateInstance.showSurvey(survicateSurveyId as string, {
              forceDisplay: true
            })
          }
        },
        { immediate: true }
      )

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
