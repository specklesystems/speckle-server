import { useOnAuthStateChange } from '~/lib/auth/composables/auth'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import { useSynchronizedCookie } from '~/lib/common/composables/reactiveCookie'
import dayjs from 'dayjs'
import type { Survicate } from '@survicate/survicate-web-surveys-wrapper'
import type { Nullable } from '@speckle/shared'

export default defineNuxtPlugin(async () => {
  const { isLoggedIn } = useActiveUser()
  let survicateInstance = null as Nullable<Survicate>

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
  const prepareSurvey = useInitMainSurvey()

  // Skip initialization if the survicateWorkspaceKey is empty or undefined
  if (!survicateWorkspaceKey?.length) {
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
    await initSurvicate({ workspaceKey: survicateWorkspaceKey })
    survicateInstance = getSurvicateInstance()

    if (!survicateInstance) {
      throw new Error('Survicate instance is not available after initialization.')
    }

    // Handle authentication state changes
    await onAuthStateChange(
      (user, { resolveDistinctId }) => {
        const distinctId = resolveDistinctId(user)
        if (distinctId && survicateInstance) {
          survicateInstance.setVisitorTraits({ distinctId })
        }
      },
      { immediate: true }
    )
  } catch (error) {
    logger.error('Survicate failed to load:', error)
  }

  if (survicateInstance) {
    prepareSurvey(survicateInstance)
  }

  return {
    provide: {
      survicate: survicateInstance
    }
  }
})

function useInitMainSurvey() {
  const onboardingOrFeedbackDateString = useSynchronizedCookie<string | undefined>(
    'onboardingOrFeedbackDate',
    {
      default: () => dayjs().startOf('day').format('YYYY-MM-DD'),
      expires: dayjs().add(999, 'day').toDate()
    }
  )
  const { projectVersionCount } = useActiveUser()

  return (survicateInstance: Survicate) => {
    const onboardingOrFeedbackDate = onboardingOrFeedbackDateString.value
      ? new Date(onboardingOrFeedbackDateString.value)
      : new Date()

    const shouldShowSurvey = checkSurveyDisplayConditions(
      onboardingOrFeedbackDate,
      projectVersionCount
    )

    if (shouldShowSurvey) {
      survicateInstance.invokeEvent('nps-survey')
    }
  }
}

function checkSurveyDisplayConditions(
  onboardingOrFeedbackDate: Date,
  projectVersionCount: ComputedRef<number | undefined>
): boolean {
  const threeDaysAfterOnboarding = dayjs(onboardingOrFeedbackDate).add(3, 'day')
  const isAfterOnboardingPeriod = dayjs().isAfter(threeDaysAfterOnboarding)

  const minimumThreeVersions = (projectVersionCount?.value ?? 0) > 2

  return isAfterOnboardingPeriod && minimumThreeVersions
}
