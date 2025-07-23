import { authLogger, type Logger } from '@/observability/logging'
import { loggerWithMaybeContext } from '@/observability/utils/requestContext'
import { addToMailchimpAudience } from '@/modules/auth/services/mailchimp'
import { UserEvents } from '@/modules/core/domain/users/events'
import {
  getMailchimpNewsletterIds,
  getMailchimpOnboardingIds,
  getMailchimpStatus
} from '@/modules/shared/helpers/envHelper'
import type { EventBus, EventPayload } from '@/modules/shared/services/eventBus'
import { getClient, MixpanelEvents } from '@/modules/shared/utils/mixpanel'
import type { UpdateUserMixpanelProfile } from '@/modules/core/domain/users/operations'
import type { DependenciesOf } from '@/modules/shared/helpers/factory'

const onUserCreatedFactory =
  (deps: { updateUserMixpanelProfileFactory: UpdateUserMixpanelProfile }) =>
  async (payload: EventPayload<typeof UserEvents.Created>) => {
    const logger = loggerWithMaybeContext({ logger: authLogger })
    const { user, signUpCtx } = payload.payload

    try {
      // Send event to MP
      const userEmail = user.email
      const newsletterConsent = signUpCtx?.newsletterConsent

      const mixpanel = getClient()
      if (userEmail && mixpanel) {
        await mixpanel.track({
          eventName: MixpanelEvents.SignUp,
          req: signUpCtx?.req,
          userEmail,
          payload: {
            isInvite: !!signUpCtx?.isInvite
          }
        })
      }

      // Set up mailchimp
      if (getMailchimpStatus()) {
        try {
          const { listId: onboardingListId } = getMailchimpOnboardingIds()
          await addToMailchimpAudience(user, onboardingListId)

          if (newsletterConsent) {
            const { listId: newsletterListId } = getMailchimpNewsletterIds()
            await addToMailchimpAudience(user, newsletterListId)
          }
        } catch (error) {
          logger.warn({ err: error }, 'Failed to sign up user to mailchimp lists')
        }
      }

      // Update MP profile
      await deps.updateUserMixpanelProfileFactory({
        userId: user.id
      })
    } catch (e) {
      logger.error(
        {
          err: e,
          userId: user.id
        },
        'Post sign up tracking failed'
      )
    }
  }

const onUserAuthenticatedFactory =
  (deps: { updateUserMixpanelProfileFactory: UpdateUserMixpanelProfile }) =>
  async (payload: EventPayload<typeof UserEvents.Authenticated>) => {
    const logger = loggerWithMaybeContext({ logger: authLogger })
    const { userId, isNewUser } = payload.payload

    // We already did this once on user creation
    if (isNewUser) return

    try {
      // Update MP profile
      await deps.updateUserMixpanelProfileFactory({
        userId
      })
    } catch (e) {
      logger.error(
        {
          err: e,
          userId
        },
        'Post sign in tracking failed'
      )
    }
  }

const onUserUpdatedFactory =
  (deps: { updateUserMixpanelProfileFactory: UpdateUserMixpanelProfile }) =>
  async (payload: EventPayload<typeof UserEvents.Updated>) => {
    const logger = loggerWithMaybeContext({ logger: authLogger })
    const {
      oldUser: { id: userId }
    } = payload.payload

    try {
      // Update MP profile
      await deps.updateUserMixpanelProfileFactory({
        userId
      })
    } catch (e) {
      logger.error(
        {
          err: e,
          userId
        },
        'Post user update tracking failed'
      )
    }
  }

export const reportUserEventsFactory =
  (
    deps: { eventBus: EventBus; logger: Logger } & DependenciesOf<
      typeof onUserCreatedFactory
    > &
      DependenciesOf<typeof onUserAuthenticatedFactory> &
      DependenciesOf<typeof onUserUpdatedFactory>
  ) =>
  () => {
    const onUserCreated = onUserCreatedFactory(deps)
    const onUserAuthenticated = onUserAuthenticatedFactory(deps)
    const onUserUpdated = onUserUpdatedFactory(deps)

    const cbs = [
      deps.eventBus.listen(UserEvents.Created, onUserCreated),
      deps.eventBus.listen(UserEvents.Authenticated, onUserAuthenticated),
      deps.eventBus.listen(UserEvents.Updated, onUserUpdated)
    ]

    return () => cbs.forEach((cb) => cb())
  }
