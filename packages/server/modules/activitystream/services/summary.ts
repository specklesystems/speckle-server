/*
IDEA, have a rest endpoint, that generates the activity html for specific queries.
This way if there is a lot of activity for a user, we can just include top highlights
and links to details

*/

/*
TASK DEFINITION
To create the activity summary, we have an activity period, ie 1 week predefined.

Every period a scheduled job starts that:

- defines which streams where active in the last period -> list of active streams
- list of active streams joined with stream_acl -> list of userId-s, who will receive summaries
- highlights should be generated per user -> we need to group and filter by stream activity
  and condense the summary to a readable length
- highlights should be generated per user per stream -> only list stream activity other than mine 
- do not ping archived users
*/

/*
BUILDING BLOCKS

per user get all the source data points:
  - grouped by streams
  - all activity that is not by the user
  - grouped by activity type?

data condenser functions:

1. global highlighter:
  - highlight the most active stream for commits
  - most active comment thread
  - comment mentions
2. per stream highlights ?

based on the number of:
  - streams
  - activity events
select data condenser function
*/

import { packageRoot } from '@/bootstrap'
import knex from '@/db/knex'
import { Activities } from '@/modules/activitystream/repositories'
import {
  ActionTypes,
  Activity,
  AllActivityTypes,
  StreamScopeActivity
} from '@/modules/activitystream/services/types'
import { Roles } from '@/modules/core/helpers/mainConstants'
import { UserRecord } from '@/modules/core/helpers/userHelper'
import { getUser } from '@/modules/core/repositories/users'
import { getStream } from '@/modules/core/services/streams'
import { getServerInfo } from '@/modules/core/services/generic'
import { groupBy } from 'lodash'
import path from 'path'
import * as ejs from 'ejs'
import mjml2html from 'mjml'

type UserStreams = {
  userId: string
  streamIds: string[]
}

export const getActiveUserStreams = async (
  start: Date,
  end: Date
): Promise<UserStreams[]> => {
  const query = knex
    .select(Activities.col.userId)
    // creates the UserSteams type by aggregating the streamId-s, grouped by userId
    .select(
      knex.raw(`array_agg(distinct ${Activities.name}."streamId") as "streamIds"`)
    )
    .from('stream_acl')
    .groupBy(Activities.col.userId)
    .join(Activities.name, Activities.col.streamId, '=', 'stream_acl.resourceId')
    .whereBetween(Activities.col.time, [start, end])
    // make sure archived users do not counted for activity
    .join('server_acl', 'server_acl.userId', '=', Activities.col.userId)
    .whereNot('server_acl.role', '=', Roles.Server.ArchivedUser)
  return await query
}
const getActivity = async (
  streamId: string,
  filteredUser: string | null = null
): Promise<StreamScopeActivity[]> => {
  let query = Activities.knex().where(Activities.col.streamId, '=', streamId)
  if (filteredUser) query = query.andWhereNot(Activities.col.userId, '=', filteredUser)
  return await query
}

type Stream = {
  id: string
  name: string
  description: string
  isPublic: boolean
  allowPublicComments: boolean
  clonedFrom: string | null
  createdAt: Date
  updatedAt: Date
}

export type StreamActivitySummary = {
  stream: Stream | null
  activity: StreamScopeActivity[]
}

export type ActivitySummary = {
  user: UserRecord
  streamActivities: StreamActivitySummary[]
}

export const createSummaryDataForEveryone = async (
  start: Date,
  end: Date
): Promise<ActivitySummary[]> => {
  const activeUserStreams = await getActiveUserStreams(start, end)

  const userActivityDigest = await Promise.all(
    activeUserStreams.map(async ({ userId, streamIds }) => {
      const streamActivities = (
        await Promise.all(
          streamIds.map(async (streamId) => {
            return {
              stream: (await getStream({ streamId, userId })) as Stream | null,
              activity: await getActivity(streamId, null) //userId is null for now, to not filter out any activity
            }
          })
        )
      ).filter((sa) => sa.activity.length)
      const user = await getUser(userId)
      if (!user) return null
      return {
        user,
        streamActivities
      }
    })
  )
  return userActivityDigest
    .filter((dig): dig is ActivitySummary => dig !== null)
    .filter((dig) => dig.streamActivities.length)
}

type DigestTopic = {
  text: string
  html: string
  cta?: {
    url: string
    title: string
    altTitle?: string
  }
  sources: Activity[]
}

type Digest = {
  user: UserRecord
  topics: DigestTopic[]
}

export type TopicDigesterFunction = (
  activitySummary: ActivitySummary,
  serverInfo: ServerInfo
) => DigestTopic | null

const countByActivityType = (
  activities: StreamScopeActivity[],
  actionType: AllActivityTypes
): number => activities.filter((a) => a.actionType === actionType).length

const sortedByActivityCount = (
  activities: StreamActivitySummary[]
): StreamActivitySummary[] =>
  activities.slice().sort((a, b) => b.activity.length - a.activity.length)

const digestMostActiveStream: TopicDigesterFunction = (activitySummary, serverInfo) => {
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
    sources: mostActive.activity
  }
  if (mostActive.stream)
    topic.cta = {
      url: `${serverInfo.canonicalUrl}/streams/${mostActive.stream.id}`,
      title: 'Check it out here!'
    }
  return topic
}

const flattenActivities = (
  activitySummaries: StreamActivitySummary[]
): StreamScopeActivity[] => {
  const allActivity: StreamScopeActivity[] = []
  activitySummaries.map((str) => allActivity.push(...str.activity))
  return allActivity
}

const digestActiveStreams: TopicDigesterFunction = (activitySummary, serverInfo) => {
  const minStreamCount = 2
  if (activitySummary.streamActivities.length <= minStreamCount) return null
  const orderedActivities = sortedByActivityCount(activitySummary.streamActivities)
  // i know it sucks, but i have to drop the most active stream here, cause its been
  // part of digests elsewhere...
  const activities = orderedActivities.slice(1, 3)

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
      html += `.<br/>It also got ${commentCount} <a href="${streamUrl}/comments">comments</a>`
      text += `.\nIt also got ${commentCount} comments. Check them at ${streamUrl}/comments`
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

const closingOverview: TopicDigesterFunction = (activitySummary) => {
  const activities = flattenActivities(activitySummary.streamActivities)
  const commitCount = activities.filter(
    (a) => a.actionType === ActionTypes.Commit.Create
  ).length
  const commentCount = activities.filter(
    (a) => a.actionType in [ActionTypes.Comment.Create, ActionTypes.Comment.Reply]
  ).length
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

const mostActiveComment: TopicDigesterFunction = (activitySummary, serverInfo) => {
  const activities = flattenActivities(activitySummary.streamActivities)
  const replyActions = activities.filter(
    (a) => a.actionType === ActionTypes.Comment.Reply
  )
  if (!replyActions.length) return null

  const parentCommentGroups = groupBy(replyActions, (a) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const info = a.info as any
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

const commentMentionSummary: TopicDigesterFunction = (activitySummary) => {
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

const farewell = () => {
  return {
    text: "That's it for this week, see you next time.\nWarm regards from the Speckle team.",
    html: "<p>That's it for this week, see you next time.<br/>Warm regards from the Speckle team.</p>",
    sources: []
  }
}

// TODO send them to tutorials digest, or a feedback form

//TODO scope inactive user email ping

/**
 * Organize the activity summary into topics.
 * The order of topics should be by relevance.
 */
const digestSummaryData = (
  activitySummary: ActivitySummary,
  serverInfo: ServerInfo
): Digest | null => {
  const topicDigesters: TopicDigesterFunction[] = [
    digestMostActiveStream,
    digestActiveStreams,
    mostActiveComment,
    commentMentionSummary,
    closingOverview
  ]

  const maybeTopics = topicDigesters.map((dig) => dig(activitySummary, serverInfo))
  const topics = maybeTopics.filter((topic): topic is DigestTopic => topic !== null)
  // if there are no topics, do not return a digest
  if (!topics.length) return null
  topics.push(farewell())
  return { user: activitySummary.user, topics }
}

type ServerInfo = {
  name: string
  company: string
  adminContact: string
  canonicalUrl: string
}

type EmailInput = {
  from?: string
  to: string
  subject: string
  text: string
  html: string
}

type EmailBody = {
  text: string
  mjml: string
}

const renderEmailBody = async (
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
  const topicPath = path.resolve(packageRoot, 'assets/activitystream/topic.ejs')
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

const renderEmailShell = async (
  body: EmailBody,
  serverInfo: ServerInfo,
  user: UserRecord
): Promise<EmailInput> => {
  const start = performance.now()
  const mjmlPath = path.resolve(
    packageRoot,
    'assets/activitystream/digestEmail.mjml.ejs'
  )
  const cta = {
    title: 'Check activities',
    url: serverInfo.canonicalUrl
  }
  const params = {
    cta,
    body,
    user,
    serverInfo
  }
  const fullMjml = await ejs.renderFile(
    mjmlPath,
    { params },
    { cache: false, outputFunctionName: 'print' }
  )
  const fullHtml = mjml2html(fullMjml, { filePath: mjmlPath })
  const renderedHtml = ejs.render(fullHtml.html, { params })

  console.log(`RENDERED IN ${performance.now() - start}`)
  return {
    to: user.email,
    subject: 'Speckle weekly digest',
    text: body.text,
    html: renderedHtml
  }
}

const prepareSummaryEmail = async (
  digest: Digest,
  serverInfo: ServerInfo
): Promise<EmailInput> => {
  const body = await renderEmailBody(digest, serverInfo)
  return await renderEmailShell(body, serverInfo, digest.user)
}

export const sendSummaryEmails = async (
  start: Date,
  end: Date,
  emailSender: (params: EmailInput) => Promise<boolean>
): Promise<boolean> => {
  const activityData = await createSummaryDataForEveryone(start, end)
  const serverInfo = (await getServerInfo()) as ServerInfo
  const digestData = activityData
    .map((activity) => digestSummaryData(activity, serverInfo))
    .filter((dig): dig is Digest => dig !== null)
  const sendResults = await Promise.all(
    digestData.map(async (digest) => {
      const emailInput = await prepareSummaryEmail(digest, serverInfo)
      return await emailSender(emailInput)
    })
  )
  return sendResults.every((res) => res)
}
