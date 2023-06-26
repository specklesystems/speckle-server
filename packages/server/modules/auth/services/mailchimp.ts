/* eslint-disable camelcase */
import mailchimp from '@mailchimp/mailchimp_marketing'
import { logger } from '@/logging/logging'
import { md5 } from '@/modules/shared/helpers/cryptoHelper'
import {
  getMailchimpConfig,
  getMailchimpStatus
} from '@/modules/shared/helpers/envHelper'
import { getUserById } from '@/modules/core/services/users'

async function addToMailchimpAudience(userId: string) {
  // Do not do anything (inc. logging) if we do not explicitely enable it
  if (!getMailchimpStatus()) return

  // Note: fails here should not block registration at any cost
  try {
    const config = getMailchimpConfig() // Note: throws an error if not configured

    mailchimp.setConfig({
      apiKey: config.apiKey,
      server: config.serverPrefix
    })

    const user = await getUserById({ userId })

    if (!user) {
      throw new Error(
        'Could not register user for newsletter - no db user record found.'
      )
    }

    const [first, second] = user.name.split(' ')
    const subscriberHash = md5(user.email.toLowerCase())

    // NOTE: using setListMember (NOT addListMember) to prevent errors for previously
    // registered members.
    await mailchimp.lists.setListMember(config.listId, subscriberHash, {
      status_if_new: 'subscribed',
      email_address: user.email,
      merge_fields: {
        EMAIL: user.email,
        FNAME: first,
        LNAME: second,
        FULLNAME: user.name // NOTE: this field needs to be set in the audience merge fields
      }
    })
  } catch (e) {
    logger.warn(e, 'Failed to register user to newsletter.')
  }
}

export { addToMailchimpAudience }
