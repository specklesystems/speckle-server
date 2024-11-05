import {
  ActivityDigestMessage,
  NotificationHandler
} from '@/modules/notifications/helpers/types'
import {
  ActionTypes,
  StreamActivityRecord,
  AllActivityTypes,
  StreamScopeActivity
} from '@/modules/activitystream/helpers/types'
import { ServerInfo, UserRecord } from '@/modules/core/helpers/types'
import { sendEmail, SendEmailParams } from '@/modules/emails/services/sending'
import { groupBy } from 'lodash'
import { packageRoot } from '@/bootstrap'
import path from 'path'
import * as ejs from 'ejs'
import {
  EmailBody,
  EmailInput,
  renderEmail
} from '@/modules/emails/services/emailRendering'
import { getUserNotificationPreferencesFactory } from '@/modules/notifications/services/notificationPreferences'
import { getSavedUserNotificationPreferencesFactory } from '@/modules/notifications/repositories'
import { db } from '@/db/knex'
import { GetUserNotificationPreferences } from '@/modules/notifications/domain/operations'
import { CreateActivitySummary } from '@/modules/activitystream/domain/operations'
import {
  ActivitySummary,
  StreamActivitySummary
} from '@/modules/activitystream/domain/types'
import { createActivitySummaryFactory } from '@/modules/activitystream/services/summary'
import { getActivityFactory } from '@/modules/activitystream/repositories'
import { getStreamFactory } from '@/modules/core/repositories/streams'
import { getUserFactory } from '@/modules/core/repositories/users'
import { GetServerInfo } from '@/modules/core/domain/server/operations'
import { getServerInfoFactory } from '@/modules/core/repositories/server'

const digestNotificationEmailHandlerFactory =
  (
    deps: {
      getUserNotificationPreferences: GetUserNotificationPreferences
      createActivitySummary: CreateActivitySummary
      getServerInfo: GetServerInfo
    } & PrepareSummaryEmailDeps
  ) =>
  async (
    userId: string,
    streamIds: string[],
    start: Date,
    end: Date,
    emailSender: (params: SendEmailParams) => Promise<boolean>
  ): Promise<boolean | null> => {
    const wantDigests =
      (await deps.getUserNotificationPreferences(userId)).activityDigest?.email !==
      false
    const activitySummary = await deps.createActivitySummary({
      userId,
      streamIds,
      start,
      end
    })
    // if there are no activities stop early
    if (!wantDigests || !activitySummary || !activitySummary.streamActivities.length)
      return null
    const serverInfo = await deps.getServerInfo()
    const digest = digestSummaryData(activitySummary, serverInfo)
    if (!digest) return null
    const emailInput = await prepareSummaryEmailFactory(deps)(digest, serverInfo)
    return await emailSender(emailInput)
  }

/**
 * Organize the activity summary into topics.
 * The order of topics should be by relevance.
 */
export const digestSummaryData = (
  activitySummary: ActivitySummary,
  serverInfo: ServerInfo,
  topicDigesters: TopicDigesterFunction[] = [
    digestMostActiveStream,
    digestActiveStreams,
    mostActiveComment,
    commentMentionSummary,
    closingOverview
  ]
): Digest | null => {
  const maybeTopics = topicDigesters.map((dig) => dig(activitySummary, serverInfo))
  const topics = maybeTopics.filter((topic): topic is DigestTopic => topic !== null)
  // if there are no topics, do not return a digest
  if (!topics.length) return null
  topics.push(farewell())
  return { user: activitySummary.user, topics }
}

export type Digest = {
  user: UserRecord
  topics: DigestTopic[]
}

export type DigestTopic = {
  text: string
  html: string
  cta?: {
    url: string
    title: string
    altTitle?: string
  }
  sources: StreamActivityRecord[]
}

type TopicDigesterFunction = (
  activitySummary: ActivitySummary,
  serverInfo: ServerInfo
) => DigestTopic | null

export const digestMostActiveStream: TopicDigesterFunction = (
  activitySummary,
  serverInfo
) => {
  // if there are less than 2 streams with activity, there is not reason to highlight it
  const minStreamCount = 1
  if (activitySummary.streamActivities.length <= minStreamCount) return null
  const orderedActivities = sortedByActivityCount(activitySummary.streamActivities)

  // we know, there are items in the array cause of the guardrail above
  // so its save to cast away from undefined
  let mostActive = orderedActivities.shift() as StreamActivitySummary
  while (mostActive.stream === null) {
    const activity = orderedActivities.shift()
    if (!activity) break
    mostActive = activity
  }
  // all the active streams were deleted, shouldn't send this topic
  if (!mostActive.stream) return null

  const commitCount = countByActivityType(
    mostActive.activity,
    ActionTypes.Commit.Create
  )

  const commentCount =
    countByActivityType(mostActive.activity, ActionTypes.Comment.Create) +
    countByActivityType(mostActive.activity, ActionTypes.Comment.Reply)

  const receives = mostActive.activity.filter(
    (a) => a.actionType === ActionTypes.Commit.Receive
  )
  const numReceiveUsers = new Set(receives.map((a) => a.userId)).size

  const heading = `Your most active stream was ${mostActive.stream.name}!`

  const facts: string[] = []
  if (commitCount) facts.push(`${commitCount} new commits were created`)
  if (commentCount) {
    if (facts.length) facts.push(' and')
    facts.push(`${facts.length ? ' u' : 'U'}sers added ${commentCount} new comments`)
  }
  if (facts.length) facts.push('.\n')
  if (receives.length)
    facts.push(
      `The commits were received ${receives.length} times by ${numReceiveUsers} users.`
    )

  const text = `${heading}\n\n${facts.join('')}`

  const html = `
<h1>${heading}</h1>
<p>${facts.join('')}</p>
`
  const topic: DigestTopic = {
    text,
    html,
    sources: mostActive.activity,
    cta: {
      url: `${serverInfo.canonicalUrl}/streams/${mostActive.stream.id}`,
      title: 'Check it out here!'
    }
  }
  return topic
}

export const mostActiveComment: TopicDigesterFunction = (
  activitySummary,
  serverInfo
) => {
  const activities = flattenActivities(activitySummary.streamActivities)
  const replyActions = activities.filter(
    (a) => a.actionType === ActionTypes.Comment.Reply
  )
  if (!replyActions.length) return null

  const parentCommentGroups = groupBy(replyActions, (a) => {
    const info = a.info as { input: { parentComment: string } }
    return info.input.parentComment
  })

  const replies = Object.entries(parentCommentGroups).reduce((currentLongest, curr) =>
    curr[1].length > currentLongest[1].length ? curr : currentLongest
  )[1]

  const streamActivity = activitySummary.streamActivities.find(
    (a) => a.stream?.id === replies[0].streamId
  )

  // the stream was deleted since
  if (!streamActivity || !streamActivity.stream) return null

  const heading = 'Most active comment'

  const fact = `The most active comment was on ${streamActivity.stream.name} stream.
  It received ${replies.length} replies.`

  const text = `${heading}\n\n${fact}`
  const html = `
  <h1>${heading}</h1>
  <p>${fact}</p>
  `

  return {
    text,
    html,
    cta: {
      url: `${serverInfo.canonicalUrl}/streams/${streamActivity.stream.id}/comments`,
      title: `Open stream comments`
    },
    sources: replyActions
  }
}

export const commentMentionSummary: TopicDigesterFunction = (activitySummary) => {
  const activities = flattenActivities(activitySummary.streamActivities)
  const mentionActions = activities.filter(
    (a) => a.actionType === ActionTypes.Comment.Mention
  )
  const mentionFact = mentionActions.length
    ? `You have been mentioned in ${mentionActions.length} comments. Make sure to follow up on them.`
    : null
  if (!mentionFact) return null
  return {
    text: mentionFact,
    html: `<p>${mentionFact}</p>`,
    sources: mentionActions
  }
}

export const farewell = () => {
  return {
    text: "That's it for this week, see you next time!",
    html: "<p>That's it for this week, see you next time!</p>",
    sources: []
  }
}

export const digestActiveStreams: TopicDigesterFunction = (
  activitySummary,
  serverInfo
) => {
  const minStreamCount = 2
  if (activitySummary.streamActivities.length <= minStreamCount) return null
  const orderedActivities = sortedByActivityCount(activitySummary.streamActivities)
  // i know it sucks, but i have to drop the most active stream here, cause its been
  // part of digests elsewhere...
  const activities = orderedActivities.slice(1, 4)

  const heading = 'Notable active streams'
  let html = `<h1>${heading}</h1>`
  let text = `${heading}\n`

  activities.map((a) => {
    //The stream was deleted
    if (!a.stream) return

    const commitCount = countByActivityType(a.activity, ActionTypes.Commit.Create)

    const commentCount =
      countByActivityType(a.activity, ActionTypes.Comment.Create) +
      countByActivityType(a.activity, ActionTypes.Comment.Reply)

    const receiveCount = countByActivityType(a.activity, ActionTypes.Commit.Receive)

    const streamUrl = `${serverInfo.canonicalUrl}/streams/${a.stream.id}`

    html += `<p><a style="font-weight:bold" href="${streamUrl}">${a.stream.name}</a>`

    text += `${a.stream.name} ${streamUrl}`

    if (commitCount) {
      html += ` had ${commitCount} new commits`
      text += ` had ${commitCount} new commits`
    }
    if (receiveCount) {
      html += ` which were received ${receiveCount} times`
      text += ` which were received ${receiveCount} times`
    }
    if (commentCount) {
      html += `. It also got ${commentCount} <a href="${streamUrl}/comments">comments</a>`
      text += `. It also got ${commentCount} comments. Check them at ${streamUrl}/comments`
    }
    html += `.<p/>`
    text += '.\n'
  })
  return {
    text,
    html,
    sources: flattenActivities(activities)
  }
}

export const closingOverview: TopicDigesterFunction = (activitySummary) => {
  const activities = flattenActivities(activitySummary.streamActivities)
  const commitCount = activities.filter(
    (a) => a.actionType === ActionTypes.Commit.Create
  ).length
  const commentCount = activities.filter((a) => {
    const actions: AllActivityTypes[] = [
      ActionTypes.Comment.Create,
      ActionTypes.Comment.Reply
    ]
    return a.actionType && actions.includes(a.actionType)
  }).length
  const receiveCount = activities.filter(
    (a) => a.actionType === ActionTypes.Commit.Receive
  ).length

  const factCount = [commitCount, commentCount, receiveCount].filter((f) => f > 0)
  if (factCount.length < 2) return null

  const fact = 'Before you leave, a quick overview:'

  let text = `${fact}\n\n`
  let html = `<p>${fact}<ul>`

  if (commitCount) {
    const factText = `Your streams received a total of ${commitCount} new commits.`
    text += `- ${factText}\n`
    html += `<li>${factText}</li>`
  }

  if (commentCount) {
    const factText = `${commentCount} comments were created.`
    text += `- ${factText}\n`
    html += `<li>${factText}</li>`
  }

  if (receiveCount) {
    const factText = `Commits were received ${receiveCount} times.`
    text += `- ${factText}\n`
    html += `<li>${factText}</li>`
  }
  return {
    text,
    html,
    sources: []
  }
}

const countByActivityType = (
  activities: StreamScopeActivity[],
  actionType: AllActivityTypes
): number => activities.filter((a) => a.actionType === actionType).length

const sortedByActivityCount = (
  activities: StreamActivitySummary[]
): StreamActivitySummary[] =>
  activities.slice().sort((a, b) => b.activity.length - a.activity.length)

const flattenActivities = (
  activitySummaries: StreamActivitySummary[]
): StreamScopeActivity[] => {
  const allActivity: StreamScopeActivity[] = []
  activitySummaries.map((str) => allActivity.push(...str.activity))
  return allActivity
}

type PrepareSummaryEmailDeps = {
  renderEmail: typeof renderEmail
}

export const prepareSummaryEmailFactory =
  (deps: PrepareSummaryEmailDeps) =>
  async (digest: Digest, serverInfo: ServerInfo): Promise<EmailInput> => {
    const body = await renderEmailBody(digest, serverInfo)
    const cta = {
      title: 'Check activities',
      url: serverInfo.canonicalUrl
    }
    const subject = 'Speckle weekly digest'
    const { text, html } = await deps.renderEmail(
      { mjml: { bodyStart: body.mjml }, text: { bodyStart: body.text }, cta },
      serverInfo,
      digest.user
    )
    return { to: digest.user.email, subject, text, html }
  }

export const renderEmailBody = async (
  digest: Digest,
  serverInfo: ServerInfo
): Promise<EmailBody> => {
  let text = `
Hello ${digest.user.name}!\n
Here's a summary of what happened in the past week
 on the Speckle server: ${serverInfo.name}\n\n
`
  // digest.topics.map((t) => (bodyStart += `${t.html}<br />`))
  digest.topics.map((t) => (text += `${t.text} \n\n`))

  let mjml = `
<mj-text>
<h3>Hello ${digest.user.name}!</h3>
<p>Here's a summary of what happened in the past week
 on the Speckle server: ${serverInfo.name} ✨ </p>
</mj-text>
`
  const topicPath = path.resolve(
    packageRoot,
    'assets/emails/templates/components/digestTopic.ejs'
  )
  const mjmlTopics = await Promise.all(
    digest.topics.map(
      async (params) =>
        await ejs.renderFile(
          topicPath,
          { params },
          { cache: true, outputFunctionName: 'print' }
        )
    )
  )

  mjml += mjmlTopics.join('\n')
  return { text, mjml }
}

const digestNotificationEmailHandler = digestNotificationEmailHandlerFactory({
  getUserNotificationPreferences: getUserNotificationPreferencesFactory({
    getSavedUserNotificationPreferences: getSavedUserNotificationPreferencesFactory({
      db
    })
  }),
  createActivitySummary: createActivitySummaryFactory({
    getStream: getStreamFactory({ db }),
    getActivity: getActivityFactory({ db }),
    getUser: getUserFactory({ db })
  }),
  getServerInfo: getServerInfoFactory({ db }),
  renderEmail
})

const handler: NotificationHandler<ActivityDigestMessage> = async (msg) => {
  const {
    targetUserId,
    data: { streamIds, start, end }
  } = msg

  await digestNotificationEmailHandler(targetUserId, streamIds, start, end, sendEmail)
}

export default handler
