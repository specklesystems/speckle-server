import { useApolloClient } from '@vue/apollo-composable'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { UnsupportedEnvironmentError } from '~~/lib/core/errors/base'
import type { OnboardingState } from '~~/lib/auth/helpers/onboarding'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import { OnboardingError } from '~~/lib/auth/errors/errors'
import { finishOnboardingMutation } from '~~/lib/auth/graphql/mutations'
import {
  convertThrowIntoFetchResult,
  getFirstErrorMessage,
  updateCacheByFilter
} from '~~/lib/common/helpers/graphql'
import { graphql } from '~~/lib/common/generated/gql'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import { useNavigateToHome } from '~~/lib/common/helpers/route'
import { projectsDashboardQuery } from '~~/lib/projects/graphql/queries'

const ONBOARDING_PROP_INDUSTRY = 'onboarding_v1_industry'
const ONBOARDING_PROP_ROLE = 'onboarding_v1_role'

export const FIRST_MODEL_NAME = 'base design'
export const SECOND_MODEL_NAME = 'building wrapper'

export function useProcessOnboarding() {
  const mixpanel = useMixpanel()
  const { distinctId, activeUser } = useActiveUser()
  const apollo = useApolloClient().client
  const { triggerNotification } = useGlobalToast()
  const goHome = useNavigateToHome()

  /**
   * Sends to mp the segmentation info (industry, role)
   * @param state
   */
  const setMixpanelSegments = (state: OnboardingState) => {
    mixpanel.people.set_once(ONBOARDING_PROP_INDUSTRY, state.industry || null)
    mixpanel.people.set_once(ONBOARDING_PROP_ROLE, state.role || null)
  }

  /**
   * Clones the server-specified onboarding project for the (newly) logged in user.
   */
  const createOnboardingProject = async () => {
    const createOnboardingProjectMutation = graphql(`
      mutation CreateOnboardingProject {
        projectMutations {
          createForOnboarding {
            ...ProjectPageProject
            ...ProjectDashboardItem
          }
        }
      }
    `)
    const { data } = await apollo
      .mutate({
        mutation: createOnboardingProjectMutation,
        update: (cache, { data }) => {
          if (!data?.projectMutations.createForOnboarding.id) return

          const newProjectData = data.projectMutations.createForOnboarding

          // Update User.projects
          updateCacheByFilter(
            cache,
            { query: { query: projectsDashboardQuery } },
            (cacheData) => {
              if (!cacheData.activeUser?.projects) return
              const newItems = [...cacheData.activeUser.projects.items, newProjectData]
              return {
                ...cacheData,
                activeUser: {
                  ...cacheData.activeUser,
                  projects: {
                    ...cacheData.activeUser.projects,
                    items: newItems,
                    totalCount: (cacheData.activeUser.projects.totalCount || 0) + 1
                  }
                }
              }
            }
          )
        }
      })
      .catch(convertThrowIntoFetchResult)

    const newId = data?.projectMutations.createForOnboarding.id
    return {
      projectId: newId,
      project: data?.projectMutations.createForOnboarding
    }
  }

  /**
   * Marks the current user as having completed the onboarding - we're using this as a flag to
   * know that we've set up the sample project once.
   */
  const setUserOnboardingComplete = async () => {
    const user = activeUser.value
    if (!user) throw new OnboardingError('Attempting to onboard unidentified user')
    await apollo
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
  }

  /**
   * DEPRECATED
   * @param state
   * @param goToDashboard
   */
  const finishOnboarding = async (state: OnboardingState, goToDashboard = true) => {
    const user = activeUser.value

    if (import.meta.server)
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
    setMixpanelSegments,
    createOnboardingProject,
    setUserOnboardingComplete,
    finishOnboarding
  }
}
