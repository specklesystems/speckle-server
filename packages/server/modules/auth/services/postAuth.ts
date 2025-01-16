import { Logger } from '@/logging/logging'
import {
  addToMailchimpAudience,
  triggerMailchimpCustomerJourney
} from '@/modules/auth/services/mailchimp'
import { UserEvents } from '@/modules/core/domain/users/events'
import {
  enableMixpanel,
  getMailchimpNewsletterIds,
  getMailchimpOnboardingIds,
  getMailchimpStatus
} from '@/modules/shared/helpers/envHelper'
import { EventBus, EventPayload } from '@/modules/shared/services/eventBus'
import { mixpanel } from '@/modules/shared/utils/mixpanel'

const onUserCreatedFactory =
  (deps: { logger: Logger }) =>
  async (payload: EventPayload<typeof UserEvents.Created>) => {
    const { user, signUpCtx } = payload.payload

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
  (deps: { eventBus: EventBus; logger: Logger }) => () => {
    const onUserCreated = onUserCreatedFactory(deps)
    const cbs = [deps.eventBus.listen(UserEvents.Created, onUserCreated)]

    return () => cbs.forEach((cb) => cb())
  }
