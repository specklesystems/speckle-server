import type {
  ActivitySummary,
  StreamActivitySummary
} from '@/modules/activitystream/domain/types'
import type {
  StreamScopeActivity,
  AllStreamActivityTypes
} from '@/modules/activitystream/helpers/types'
import {
  StreamActionTypes,
  StreamResourceTypes
} from '@/modules/activitystream/helpers/types'
import type { ServerInfo, UserRecord } from '@/modules/core/helpers/types'
import { ProjectRecordVisibility } from '@/modules/core/helpers/types'
import { renderEmail } from '@/modules/emails/services/emailRendering'
import type {
  DigestTopic,
  Digest
} from '@/modules/notifications/services/handlers/activityDigest'
import {
  digestMostActiveStream,
  mostActiveComment,
  digestSummaryData,
  farewell,
  commentMentionSummary,
  digestActiveStreams,
  closingOverview,
  prepareSummaryEmailFactory
} from '@/modules/notifications/services/handlers/activityDigest'
import { expect } from 'chai'
import { range } from 'lodash-es'

const prepareSummaryEmail = prepareSummaryEmailFactory({
  renderEmail
})

describe('Activity digest notifications @notifications', () => {
  const user: UserRecord = {
    id: 'foobar',
    suuid: 'so this is uuid',
    createdAt: new Date(),
    name: 'Foo Bar',
    email: 'foo@bar.com',
    bio: null,
    company: null,
    verified: true,
    avatar: 'Jake Sully',
    profiles: null,
    ip: null
  }

  const serverInfo: ServerInfo = {
    id: 1,
    name: 'this is just a test dummy',
    company: 'The fumblers',
    description: 'now that u ask, i have no idea',
    adminContact: 'probably Speckle Bot',
    termsOfService: 'just dont make a mess ok?',
    canonicalUrl: 'this would be localhost:// or whatever',
    completed: false,
    inviteOnly: true,
    version: 'testing 1 2 3',
    guestModeEnabled: false,
    configuration: {
      objectMultipartUploadSizeLimitBytes: 1_000_000,
      objectSizeLimitBytes: 1_000_000,
      isEmailEnabled: true,
      emailVerificationTimeoutMinutes: 5
    }
  }

  const topic: DigestTopic = {
    text: 'i digested everything',
    html: 'and rendered it in html',
    sources: []
  }
  describe('Digest summary data', () => {
    it('returns null if there are no topics', () => {
      const digest = digestSummaryData({ user, streamActivities: [] }, serverInfo, [])
      expect(digest).to.be.null
    })
    it('filters invalid digest topics', () => {
      const digest = digestSummaryData({ user, streamActivities: [] }, serverInfo, [
        () => null
      ])
      expect(digest).to.be.null
    })
    it('adds valid topics to the result', () => {
      const digest = digestSummaryData({ user, streamActivities: [] }, serverInfo, [
        () => topic
      ])

      expect(digest?.topics[0]).to.be.deep.equal(topic)
    })
    it('adds result of farewell if there are valid topics', () => {
      const digest = digestSummaryData({ user, streamActivities: [] }, serverInfo, [
        () => topic
      ])
      expect(digest?.topics[1]).to.be.deep.equal(farewell())
    })
  })
  describe('Topic digester functions', () => {
    const createActivity = (
      actionType: AllStreamActivityTypes = StreamActionTypes.Stream.Create,
      streamId = 'stream',
      info = {}
    ) => ({
      streamId,
      time: new Date(),
      resourceType: StreamResourceTypes.Stream,
      resourceId: 'stream',
      actionType,
      userId: 'me',
      info,
      message: 'let there be light'
    })
    const createBasicActivity = (
      streamName = 'stream',
      activities: StreamScopeActivity[] | null = null
    ): StreamActivitySummary => ({
      stream: {
        id: streamName,
        description: 'tester',
        name: streamName,
        visibility: ProjectRecordVisibility.Public,
        clonedFrom: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        allowPublicComments: true,
        workspaceId: null,
        regionKey: null
      },
      activity: activities ?? [createActivity()]
    })
    describe('Digest most active stream', () => {
      it('if stream count is low, it returns null', () => {
        const summary: ActivitySummary = { user, streamActivities: [] }
        const digestTopic = digestMostActiveStream(summary, serverInfo)
        expect(digestTopic).to.be.null
      })

      it('if stream activity streams do not exist any more, it returns null', () => {
        const summary: ActivitySummary = {
          user,
          streamActivities: [
            { stream: null, activity: [] },
            { stream: null, activity: [] }
          ]
        }
        const digestTopic = digestMostActiveStream(summary, serverInfo)
        expect(digestTopic).to.be.null
      })

      it('adds heading if there is any activity', () => {
        const mostActiveName = 'test test test'
        const summary: ActivitySummary = {
          user,
          streamActivities: [
            createBasicActivity('not so active', []),
            createBasicActivity(mostActiveName)
          ]
        }
        const digestTopic = digestMostActiveStream(summary, serverInfo)
        expect(digestTopic).to.be.not.null
        const expected = `Your most active stream was ${mostActiveName}`
        expect(digestTopic?.html).to.contain(expected)
        expect(digestTopic?.text).to.contain(expected)
      })
      it('adds cta if there is any activity', () => {
        const mostActiveName = 'test test test'
        const summary: ActivitySummary = {
          user,
          streamActivities: [
            createBasicActivity('not so active', []),
            createBasicActivity(mostActiveName)
          ]
        }
        const digestTopic = digestMostActiveStream(summary, serverInfo)
        expect(digestTopic).to.be.not.null
        expect(digestTopic?.cta).to.deep.equal({
          url: `${serverInfo.canonicalUrl}/streams/${mostActiveName}`,
          title: 'Check it out here!'
        })
      })

      it('adds commits info if there is any activity', () => {
        const mostActiveName = 'test test test'
        const summary: ActivitySummary = {
          user,
          streamActivities: [
            createBasicActivity('not so active', []),
            createBasicActivity(mostActiveName, [
              createActivity(),
              createActivity(StreamActionTypes.Commit.Create)
            ])
          ]
        }
        const digestTopic = digestMostActiveStream(summary, serverInfo)
        expect(digestTopic).to.be.not.null
        const expected = `1 new commits were created`
        expect(digestTopic?.html).to.contain(expected)
        expect(digestTopic?.text).to.contain(expected)
      })
      it('adds comment info if there is any activity', () => {
        const mostActiveName = 'test test test'
        const summary: ActivitySummary = {
          user,
          streamActivities: [
            createBasicActivity('not so active', []),
            createBasicActivity(mostActiveName, [
              createActivity(),
              createActivity(StreamActionTypes.Comment.Create)
            ])
          ]
        }
        const digestTopic = digestMostActiveStream(summary, serverInfo)
        expect(digestTopic).to.be.not.null
        const expected = `Users added 1 new comments`
        expect(digestTopic?.html).to.contain(expected)
        expect(digestTopic?.text).to.contain(expected)
      })
      it('adds comment and commit info if both have activity', () => {
        const mostActiveName = 'test test test'
        const summary: ActivitySummary = {
          user,
          streamActivities: [
            createBasicActivity('not so active', []),
            createBasicActivity(mostActiveName, [
              createActivity(),
              createActivity(StreamActionTypes.Comment.Create),
              createActivity(StreamActionTypes.Commit.Create)
            ])
          ]
        }
        const digestTopic = digestMostActiveStream(summary, serverInfo)
        expect(digestTopic).to.be.not.null
        const expected = `1 new commits were created and users added 1 new comments.`
        expect(digestTopic?.html).to.contain(expected)
        expect(digestTopic?.text).to.contain(expected)
      })
      it('adds receive info', () => {
        const mostActiveName = 'test test test'
        const summary: ActivitySummary = {
          user,
          streamActivities: [
            createBasicActivity('not so active', []),
            createBasicActivity(mostActiveName, [
              createActivity(),
              createActivity(StreamActionTypes.Commit.Receive)
            ])
          ]
        }
        const digestTopic = digestMostActiveStream(summary, serverInfo)
        expect(digestTopic).to.be.not.null
        const expected = `The commits were received 1 times by 1 users.`
        expect(digestTopic?.html).to.contain(expected)
        expect(digestTopic?.text).to.contain(expected)
      })
    })

    describe('Digest most active comment', () => {
      it('it returns null if there are no comment replies', () => {
        const mostActiveName = 'test test test'
        const summary: ActivitySummary = {
          user,
          streamActivities: [
            createBasicActivity('not so active', []),
            createBasicActivity(mostActiveName, [
              createActivity(),
              createActivity(StreamActionTypes.Comment.Create)
            ])
          ]
        }
        const digestTopic = mostActiveComment(summary, serverInfo)
        expect(digestTopic).to.be.null
      })
      it('it returns comments digest topic', () => {
        const mostActiveName = 'test test test'
        const parentComment = 'lotta talk'
        const summary: ActivitySummary = {
          user,
          streamActivities: [
            createBasicActivity('not so active', [
              createActivity(StreamActionTypes.Comment.Create),
              createActivity(StreamActionTypes.Comment.Reply, 'not so active', {
                input: { parentComment: 'another one' }
              })
            ]),
            createBasicActivity(mostActiveName, [
              createActivity(),
              createActivity(StreamActionTypes.Comment.Create),
              createActivity(StreamActionTypes.Comment.Reply, mostActiveName, {
                input: { parentComment }
              }),
              createActivity(StreamActionTypes.Comment.Reply, mostActiveName, {
                input: { parentComment }
              })
            ])
          ]
        }
        const digestTopic = mostActiveComment(summary, serverInfo)
        expect(digestTopic).to.be.not.null
        const expected = `The most active comment was on ${mostActiveName} stream.`
        const alsoExpected = `It received 2 replies.`
        expect(digestTopic?.html).to.contain(expected)
        expect(digestTopic?.text).to.contain(expected)
        expect(digestTopic?.html).to.contain(alsoExpected)
        expect(digestTopic?.text).to.contain(alsoExpected)
      })
    })

    describe('Digest comment mention summary', () => {
      it('returns no topic if no mentions', () => {
        const summary: ActivitySummary = {
          user,
          streamActivities: [createBasicActivity('stream', [createActivity()])]
        }
        const digestTopic = commentMentionSummary(summary, serverInfo)
        expect(digestTopic).to.be.null
      })
      it('creates a topic is there are mentions', () => {
        const summary: ActivitySummary = {
          user,
          streamActivities: [
            createBasicActivity('stream', [
              createActivity(),
              createActivity(StreamActionTypes.Comment.Mention),
              createActivity(StreamActionTypes.Comment.Mention)
            ])
          ]
        }
        const digestTopic = commentMentionSummary(summary, serverInfo)
        expect(digestTopic).to.be.not.null
        const expected = `You have been mentioned in 2 comments. Make sure`
        expect(digestTopic?.html).to.contain(expected)
        expect(digestTopic?.text).to.contain(expected)
      })
    })

    describe('Digest active streams', () => {
      it("returns invalid topic if there aren't enough active streams", () => {
        const summary = {
          user,
          streamActivities: [createBasicActivity()]
        }
        const digestTopic = digestActiveStreams(summary, serverInfo)
        expect(digestTopic).to.be.null
      })
      it('uses activities from the 3 most active streams after the most active one', () => {
        const expectedActivity = createActivity(StreamActionTypes.Branch.Update)
        const alsoExpectedActivity = createActivity(StreamActionTypes.Comment.Reply)
        const summary = {
          user,
          streamActivities: [
            createBasicActivity('activity', [createActivity(), createActivity()]),
            createBasicActivity('activity', [expectedActivity]),
            createBasicActivity('activity', [alsoExpectedActivity]),
            createBasicActivity('activity', [expectedActivity])
          ]
        }
        const digestTopic = digestActiveStreams(summary, serverInfo)
        expect(digestTopic).to.be.not.null
        expect(digestTopic?.sources).to.be.deep.equalInAnyOrder([
          expectedActivity,
          alsoExpectedActivity,
          expectedActivity
        ])
      })
      const expectedTag = (start: string, end: string) => (num: number) =>
        `${start}${num}${end}`

      const testDigestActiveStreamPart = (
        actionType: AllStreamActivityTypes,
        renderTag: (num: number) => string,
        serverInfo: ServerInfo
      ) => {
        const summary = {
          user,
          streamActivities: [
            createBasicActivity('activity', [createActivity(), createActivity()])
          ]
        }
        for (const i of range(1, 3)) {
          const activities = [...Array(i)].map(() => createActivity(actionType))
          summary.streamActivities.push(createBasicActivity(`stream ${i}`, activities))
        }
        const digestTopic = digestActiveStreams(summary, serverInfo)
        for (const i of range(1, 3)) {
          const expected = renderTag(i)
          expect(digestTopic?.html).to.include(expected)
          expect(digestTopic?.text).to.include(expected)
        }
      }
      const digestActiveStreamsData = [
        [
          'adds commit count to topic',
          StreamActionTypes.Commit.Create,
          'had ',
          ' new commits'
        ],
        [
          'adds receive count to topic',
          StreamActionTypes.Commit.Receive,
          ' which were received ',
          ' times'
        ],
        [
          'adds comment count to topic',
          StreamActionTypes.Comment.Create,
          'It also got ',
          ' '
        ]
      ]

      digestActiveStreamsData.map(([testName, actionType, start, end]) => {
        it(testName, () => {
          testDigestActiveStreamPart(
            actionType as AllStreamActivityTypes,
            expectedTag(start, end),
            serverInfo
          )
        })
      })
    })
    describe('Digest closing overview', () => {
      it("returns invalid topic if there aren't enough facts", () => {
        const summary = {
          user,
          streamActivities: [
            createBasicActivity('activity', [
              createActivity(StreamActionTypes.Comment.Create)
            ])
          ]
        }
        const digestTopic = closingOverview(summary, serverInfo)
        expect(digestTopic).to.be.null
      })
      it('adds commit count to topic', () => {
        const summary = {
          user,
          streamActivities: [
            createBasicActivity('activity', [
              createActivity(StreamActionTypes.Comment.Reply),
              createActivity(StreamActionTypes.Commit.Create)
            ])
          ]
        }
        const digestTopic = closingOverview(summary, serverInfo)
        const expected = 'Your streams received a total of 1 new commits.'
        expect(digestTopic?.html).to.contain(expected)
        expect(digestTopic?.text).to.contain(expected)
      })
      it('adds comment count to topic', () => {
        const summary = {
          user,
          streamActivities: [
            createBasicActivity('activity', [
              createActivity(StreamActionTypes.Comment.Create),
              createActivity(StreamActionTypes.Commit.Create)
            ])
          ]
        }
        const digestTopic = closingOverview(summary, serverInfo)
        const expected = '1 comments were created'
        expect(digestTopic?.html).to.contain(expected)
        expect(digestTopic?.text).to.contain(expected)
      })
      it('adds receive count to topic', () => {
        const summary = {
          user,
          streamActivities: [
            createBasicActivity('activity', [
              createActivity(StreamActionTypes.Comment.Reply),
              createActivity(StreamActionTypes.Commit.Receive)
            ])
          ]
        }
        const digestTopic = closingOverview(summary, serverInfo)
        const expected = 'Commits were received 1 times.'
        expect(digestTopic?.html).to.contain(expected)
        expect(digestTopic?.text).to.contain(expected)
      })
    })
  })

  describe('Notification email rendering', () => {
    describe('Render email body', () => {
      it('Renders topics into an EmailInput', async () => {
        const expected =
          'Hey, this is the content that gets rendered in to the template'
        const cta = 'Uproots and after them!'
        const digest: Digest = {
          user,
          topics: [
            {
              text: expected,
              html: expected,
              cta: {
                url: cta,
                title: cta
              },
              sources: []
            }
          ]
        }
        const { text, html, to } = await prepareSummaryEmail(digest, serverInfo)
        expect(text).to.contain(expected)
        expect(to).to.be.equal(user.email)
        expect(html).to.contain(expected)
        expect(html).to.contain(cta)
      })
    })
  })
})
