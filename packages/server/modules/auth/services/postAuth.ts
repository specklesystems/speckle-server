import { Logger } from '@/logging/logging'
import {
  addToMailchimpAudience,
  triggerMailchimpCustomerJourney
} from '@/modules/auth/services/mailchimp'
import {
  UsersEvents,
  UsersEventsListener,
  UsersEventsPayloads
} from '@/modules/core/events/usersEmitter'
import {
  enableMixpanel,
  getMailchimpNewsletterIds,
  getMailchimpOnboardingIds,
  getMailchimpStatus
} from '@/modules/shared/helpers/envHelper'
import { mixpanel } from '@/modules/shared/utils/mixpanel'

const onUserCreatedFactory =
  (deps: { logger: Logger }) =>
  async (payload: UsersEventsPayloads[UsersEvents.Created]) => {
    const { user, signUpCtx } = payload

    try {
      // Send event to MP
      const userEmail = user.email
      const newsletterConsent = signUpCtx?.newsletterConsent

      if (userEmail && enableMixpanel()) {
        const isInvite = !!signUpCtx?.isInvite
        await mixpanel({ userEmail, req: signUpCtx?.req }).track('Sign Up', {
          isInvite
        })
      }

      // Set up mailchimp
      if (getMailchimpStatus()) {
        try {
          const onboardingIds = getMailchimpOnboardingIds()
          await triggerMailchimpCustomerJourney(user, onboardingIds)

          if (newsletterConsent) {
            const { listId } = getMailchimpNewsletterIds()
            await addToMailchimpAudience(user, listId)
          }
        } catch (error) {
          deps.logger.warn(error, 'Failed to sign up user to mailchimp lists')
        }
      }
    } catch (e) {
      deps.logger.error(
        {
          error: e,
          userId: user.id
        },
        'Post sign up tracking failed'
      )
    }
  }

export const initializeEventListenerFactory =
  (deps: { usersEventsListener: UsersEventsListener; logger: Logger }) => () => {
    const onUserCreated = onUserCreatedFactory(deps)

    const cbs = [deps.usersEventsListener(UsersEvents.Created, onUserCreated)]

    return () => cbs.forEach((cb) => cb())
  }
