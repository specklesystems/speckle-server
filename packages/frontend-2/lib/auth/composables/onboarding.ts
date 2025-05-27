import { useApolloClient } from '@vue/apollo-composable'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { UnsupportedEnvironmentError } from '~~/lib/core/errors/base'
import type { OnboardingState } from '@speckle/shared'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import { OnboardingError } from '~~/lib/auth/errors/errors'
import { finishOnboardingMutation } from '~~/lib/auth/graphql/mutations'
import { convertThrowIntoFetchResult } from '~~/lib/common/helpers/graphql'

export const useProcessOnboarding = () => {
  const mixpanel = useMixpanel()
  const { activeUser } = useActiveUser()
  const apollo = useApolloClient().client

  const setMixpanelSegments = (segments: Partial<OnboardingState>) => {
    mixpanel.people.set(segments)
  }

  /**
   * Marks the current user as having completed the onboarding.
   */
  const setUserOnboardingComplete = async (onboardingData?: OnboardingState) => {
    const user = activeUser.value

    if (import.meta.server)
      throw new UnsupportedEnvironmentError("Can't process onboarding during SSR")

    if (!user) throw new OnboardingError('Attempting to onboard unidentified user')

    mixpanel.people.set_once({
      onboardingSurveyRole: onboardingData?.role,
      onboardingSurveyUseCase: onboardingData?.plans,
      onboardingSurveySource: onboardingData?.source
    })

    await apollo
      .mutate({
        mutation: finishOnboardingMutation,
        variables: {
          input: onboardingData
        },
        update: (cache, { data }) => {
          if (!data?.activeUserMutations.finishOnboarding) return

          // Mark onboarding as finished in the cache
          cache.modify({
            id: cache.identify(user),
            fields: {
              isOnboardingFinished: () => true
            }
          })
        }
      })
      .catch(convertThrowIntoFetchResult)
  }

  return {
    setMixpanelSegments,
    setUserOnboardingComplete
  }
}
