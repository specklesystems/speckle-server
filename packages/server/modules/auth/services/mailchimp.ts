/* eslint-disable camelcase */
import mailchimp from '@mailchimp/mailchimp_marketing'
import { md5 } from '@/modules/shared/helpers/cryptoHelper'
import { getMailchimpConfig } from '@/modules/shared/helpers/envHelper'
import { UserRecord } from '@/modules/core/helpers/types'
import { MisconfiguredEnvironmentError } from '@/modules/shared/errors'
import { OnboardingCompletionInput } from '@/modules/core/graph/generated/graphql'

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

export async function addToMailchimpAudience(user: UserRecord, listId: string) {
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

export async function updateMailchimpMemberTags(
  user: UserRecord,
  listId: string,
  onboardingData: OnboardingCompletionInput
) {
  initializeMailchimp()
  const subscriberHash = md5(user.email.toLowerCase())

  // Add user to audience if they are not already in it
  await addToMailchimpAudience(user, listId)

  const tags: { name: string; status: 'active' | 'inactive' }[] = []

  if (onboardingData.role) {
    tags.push({
      name: `Role: ${onboardingData.role}`,
      status: 'active'
    })
  }

  if (onboardingData.plans?.length) {
    onboardingData.plans.forEach((plan) => {
      tags.push({
        name: `Use case: ${plan}`,
        status: 'active'
      })
    })
  }

  if (onboardingData.source) {
    tags.push({
      name: `Source: ${onboardingData.source}`,
      status: 'active'
    })
  }

  await mailchimp.lists.updateListMemberTags(listId, subscriberHash, {
    tags
  })
}
