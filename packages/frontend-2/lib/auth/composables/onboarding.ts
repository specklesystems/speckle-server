import { useApolloClient } from '@vue/apollo-composable'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { UnsupportedEnvironmentError } from '~~/lib/core/errors/base'
import { OnboardingState } from '../helpers/onboarding'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import { OnboardingError } from '~~/lib/auth/errors/errors'
import { finishOnboardingMutation } from '~~/lib/auth/graphql/mutations'
import {
  convertThrowIntoFetchResult,
  getFirstErrorMessage
} from '~~/lib/common/helpers/graphql'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import { useNavigateToHome } from '~~/lib/common/helpers/route'

const ONBOARDING_PROP_INDUSTRY = 'onboarding_v1_industry'
const ONBOARDING_PROP_ROLE = 'onboarding_v1_role'

export function useProcessOnboarding() {
  const mixpanel = useMixpanel()
  const { distinctId, activeUser } = useActiveUser()
  const apollo = useApolloClient().client
  const { triggerNotification } = useGlobalToast()
  const goHome = useNavigateToHome()

  const finishOnboarding = async (state: OnboardingState, goToDashboard = true) => {
    const user = activeUser.value

    if (process.server)
      throw new UnsupportedEnvironmentError("Can't process onboarding during SSR")

    if (!distinctId.value || !user)
      throw new OnboardingError('Attempting to onboard unidentified user')

    // Send data to mixpanel
    mixpanel.people.set_once(ONBOARDING_PROP_INDUSTRY, state.industry || null)
    mixpanel.people.set_once(ONBOARDING_PROP_ROLE, state.role || null)

    // Mark onboarding as finished
    const { data, errors } = await apollo
      .mutate({
        mutation: finishOnboardingMutation,
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

    if (data?.activeUserMutations.finishOnboarding) {
      if (goToDashboard) goHome()
    } else {
      const errMsg = getFirstErrorMessage(errors)
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: errMsg
      })
    }
  }

  return {
    finishOnboarding
  }
}
