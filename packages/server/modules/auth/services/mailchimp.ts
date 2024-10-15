/* eslint-disable camelcase */
import mailchimp from '@mailchimp/mailchimp_marketing'
import { md5 } from '@/modules/shared/helpers/cryptoHelper'
import { getMailchimpConfig } from '@/modules/shared/helpers/envHelper'
import { UserRecord } from '@/modules/core/helpers/types'

let mailchimpInitialized = false

function initializeMailchimp() {
  if (mailchimpInitialized) return
  const config = getMailchimpConfig() // Note: throws an error if not configured
  if (!config) throw new Error('Cannot initialize mailchimp without config values')

  mailchimp.setConfig({
    apiKey: config.apiKey,
    server: config.serverPrefix
  })
  mailchimpInitialized = true
}

async function addToMailchimpAudience(user: UserRecord, listId: string) {
  initializeMailchimp()
  // Do not do anything (inc. logging) if we do not explicitly enable it
  // Note: fails here should not block registration at any cost

  const [first, second] = user.name.split(' ')
  const subscriberHash = md5(user.email.toLowerCase())

  // NOTE: using setListMember (NOT addListMember) to prevent errors for previously
  // registered members.
  await mailchimp.lists.setListMember(listId, subscriberHash, {
    status_if_new: 'subscribed',
    email_address: user.email,
    merge_fields: {
      EMAIL: user.email,
      FNAME: first,
      LNAME: second,
      FULLNAME: user.name // NOTE: this field needs to be set in the audience merge fields
    }
  })
}

async function triggerMailchimpCustomerJourney(
  user: UserRecord,
  {
    listId,
    journeyId,
    stepId
  }: {
    listId: string
    journeyId: number
    stepId: number
  }
) {
  await addToMailchimpAudience(user, listId)
  // @ts-expect-error the mailchimp api typing sucks
  await mailchimp.customerJourneys.trigger(journeyId, stepId, {
    email_address: user.email
  })
}

export { addToMailchimpAudience, triggerMailchimpCustomerJourney }
