/* eslint-disable camelcase */
import mailchimp from '@mailchimp/mailchimp_marketing'
import { md5 } from '@/modules/shared/helpers/cryptoHelper'
import { getMailchimpConfig } from '@/modules/shared/helpers/envHelper'
import { UserRecord } from '@/modules/core/helpers/types'
import { MisconfiguredEnvironmentError } from '@/modules/shared/errors'

let mailchimpInitialized = false

function initializeMailchimp() {
  if (mailchimpInitialized) return
  const config = getMailchimpConfig() // Note: throws an error if not configured
  if (!config)
    throw new MisconfiguredEnvironmentError(
      'Cannot initialize mailchimp without config values'
    )

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

async function updateMailchimpMemberTags(
  user: UserRecord,
  listId: string,
  onboardingData: {
    role?: string
    plans?: string[]
    source?: string
  }
) {
  initializeMailchimp()
  const subscriberHash = md5(user.email.toLowerCase())

  // First ensure user is in the audience
  await addToMailchimpAudience(user, listId)

  // Build tags array
  const tags: { name: string; status: 'active' | 'inactive' }[] = []

  // Add role tag if present
  if (onboardingData.role) {
    tags.push({
      name: `Role: ${onboardingData.role}`,
      status: 'active'
    })
  }

  // Add plan tags if present
  if (onboardingData.plans?.length) {
    onboardingData.plans.forEach((plan) => {
      tags.push({
        name: `Plan: ${plan}`,
        status: 'active'
      })
    })
  }

  // Add source tag if present
  if (onboardingData.source) {
    tags.push({
      name: `Source: ${onboardingData.source}`,
      status: 'active'
    })
  }

  // Update member tags
  await mailchimp.lists.updateListMemberTags(listId, subscriberHash, {
    tags
  })
}

export {
  addToMailchimpAudience,
  triggerMailchimpCustomerJourney,
  updateMailchimpMemberTags
}
