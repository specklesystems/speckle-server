import { useOnAuthStateChange } from '~/lib/auth/composables/auth'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import { useSynchronizedCookie } from '~/lib/common/composables/reactiveCookie'
import dayjs from 'dayjs'
import type { Survicate } from '@survicate/survicate-web-surveys-wrapper'
import type { Nullable } from '@speckle/shared'

export default defineNuxtPlugin(async () => {
  const { isLoggedIn } = useActiveUser()
  const survicateInstance = null as Nullable<Survicate>

  if (!isLoggedIn.value) {
    return {
      provide: {
        survicate: survicateInstance
      }
    }
  }

  const {
    public: { survicateWorkspaceKey }
  } = useRuntimeConfig()

  const logger = useLogger()
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

    // Handle authentication state changes
    await onAuthStateChange(
      (user, { resolveDistinctId }) => {
        const distinctId = resolveDistinctId(user)
        if (distinctId) {
          survicateInstance.setVisitorTraits({ distinctId })
        }
      },
      { immediate: true }
    )
  } catch (error) {
    logger.error('Survicate failed to load:', error)
  }

  if (survicateInstance) {
    initMainSurvey(survicateInstance)
  }

  return {
    provide: {
      survicate: survicateInstance
    }
  }
})

function initMainSurvey(survicateInstance: Survicate) {
  const {
    public: { survicateNpsSurveyId }
  } = useRuntimeConfig()

  const onboardingOrFeedbackDateString = useSynchronizedCookie<string | undefined>(
    'onboardingOrFeedbackDate',
    {
      default: () => dayjs().startOf('day').format('YYYY-MM-DD'),
      expires: dayjs().add(999, 'day').toDate()
    }
  )

  const onboardingOrFeedbackDate = onboardingOrFeedbackDateString.value
    ? new Date(onboardingOrFeedbackDateString.value)
    : new Date()

  const shouldShowSurvey = checkSurveyDisplayConditions(onboardingOrFeedbackDate)

  if (shouldShowSurvey) {
    survicateInstance.showSurvey(survicateNpsSurveyId, {
      forceDisplay: true
    })
  }
}

function checkSurveyDisplayConditions(onboardingOrFeedbackDate: Date): boolean {
  const { projectVersionCount } = useActiveUser()

  const threeDaysAfterOnboarding = dayjs(onboardingOrFeedbackDate).add(3, 'day')
  const isAfterOnboardingPeriod = dayjs().isAfter(threeDaysAfterOnboarding)

  const minimumThreeVersions = (projectVersionCount?.value ?? 0) > 2

  return isAfterOnboardingPeriod && minimumThreeVersions
}
