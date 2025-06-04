import { createTestUser } from '@/test/authHelper'
import { ExecuteOperationResponse, testApolloServer } from '@/test/graphqlHelper'
import { beforeEachContext } from '@/test/hooks'
import { createProject, grantPermissionsOnProject } from '@/test/projectHelper'
import { Roles } from '@speckle/shared'
import { expect } from 'chai'
import cryptoRandomString from 'crypto-random-string'
import gql from 'graphql-tag'
import { SetNonNullable } from 'type-fest'

const testForbiddenResponse = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  result: ExecuteOperationResponse<Record<string, any>>
) => {
  expect(result.errors, 'This should have failed').to.exist
  expect(result.errors!.length).to.be.above(0)
  expect(result.errors![0].extensions!.code, JSON.stringify(result.errors)).to.match(
    /(STREAM_INVALID_ACCESS_ERROR|FORBIDDEN|UNAUTHORIZED_ACCESS_ERROR)/
  )
}

const testResult = (
  shouldSucceed: boolean,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  result: ExecuteOperationResponse<Record<string, any>>,
  successTests: (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    result: SetNonNullable<ExecuteOperationResponse<Record<string, any>>, 'data'>
  ) => void
) => {
  if (shouldSucceed) {
    expect(
      result.errors,
      'This should not have failed and yet we found errors: ' +
        JSON.stringify(result.errors)
    ).to.not.exist
    successTests(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      result as SetNonNullable<ExecuteOperationResponse<Record<string, any>>, 'data'>
    )
  } else {
    testForbiddenResponse(result)
  }
}

type TestContext = {
  apollo: Awaited<ReturnType<typeof testApolloServer>>
  shouldSucceed: boolean
  projectId: string
  fileName: string
}

const generateUploadUrl = async (params: TestContext) => {
  const { apollo, projectId, fileName, shouldSucceed } = params
  const res = await apollo.execute(
    gql`
      mutation ($input: GenerateUploadUrlInput!) {
        blobMutations {
          generateUploadUrl(input: $input) {
            url
            blobId
          }
        }
      }
    `,
    {
      input: {
        projectId,
        fileName
      }
    }
  )
  testResult(shouldSucceed, res, (res) => {
    expect(res.data.blobId).to.be.string
    expect(res.data.blobId.length).to.equal(10)
    expect(res.data.url).to.be.string
    expect(res.data.url).to.be.not.empty
    expect(res.data.url.startsWith('https://')).to.be.true
  })
}

describe('Presigned graph @blobstorage', async () => {
  const serverAdmin = { id: '', name: 'server admin', role: Roles.Server.Admin }
  const regularServerUser = {
    id: '',
    name: 'regular server user',
    role: Roles.Server.User
  }
  const archivedUser = {
    id: '',
    name: 'archived user',
    role: Roles.Server.ArchivedUser
  }
  const unaffiliatedUser = {
    id: '',
    name: 'unaffiliated user',
    role: Roles.Server.Guest
  }

  const ownedProject = {
    id: '',
    name: 'owned stream',
    isPublic: false
  }
  const contributorProject = {
    id: '',
    name: 'contributions are welcome',
    isPublic: false
  }
  const reviewerProject = {
    id: '',
    name: 'reviewer stream',
    isPublic: false
  }
  const noAccessProject = {
    id: '',
    name: 'cannot touch this',
    isPublic: false
  }
  const publicProject = {
    id: '',
    name: 'everyone can look',
    isPublic: true
  }

  before(async () => {
    await beforeEachContext()
    serverAdmin.id = (await createTestUser(serverAdmin)).id
    regularServerUser.id = (await createTestUser(regularServerUser)).id
    archivedUser.id = (await createTestUser(archivedUser)).id
    unaffiliatedUser.id = (await createTestUser(unaffiliatedUser)).id

    ownedProject.id = (
      await createProject({
        ...ownedProject,
        ownerId: serverAdmin.id
      })
    ).id

    contributorProject.id = (
      await createProject({
        ...contributorProject,
        ownerId: serverAdmin.id
      })
    ).id

    reviewerProject.id = (
      await createProject({
        ...reviewerProject,
        ownerId: serverAdmin.id
      })
    ).id

    noAccessProject.id = (
      await createProject({
        ...noAccessProject,
        ownerId: serverAdmin.id
      })
    ).id

    publicProject.id = (
      await createProject({
        ...publicProject,
        ownerId: serverAdmin.id
      })
    ).id
  })

  const testData = <const>[
    {
      user: regularServerUser,
      projectData: [
        {
          project: ownedProject,
          projectRole: Roles.Stream.Owner,
          cases: [[generateUploadUrl, true]]
        },
        {
          project: contributorProject,
          projectRole: Roles.Stream.Contributor,
          cases: [[generateUploadUrl, true]]
        },
        {
          project: reviewerProject,
          projectRole: Roles.Stream.Reviewer,
          cases: [[generateUploadUrl, true]]
        },
        {
          project: noAccessProject,
          projectRole: null,
          cases: [[generateUploadUrl, false]]
        },
        {
          project: publicProject,
          projectRole: null,
          cases: [[generateUploadUrl, false]]
        }
      ]
    },
    {
      user: archivedUser,
      projectData: [
        {
          project: ownedProject,
          projectRole: Roles.Stream.Owner,
          cases: [[generateUploadUrl, false]]
        },
        {
          project: contributorProject,
          projectRole: Roles.Stream.Contributor,
          cases: [[generateUploadUrl, false]]
        },
        {
          project: reviewerProject,
          projectRole: Roles.Stream.Reviewer,
          cases: [[generateUploadUrl, false]]
        },
        {
          project: noAccessProject,
          projectRole: null,
          cases: [[generateUploadUrl, false]]
        },
        {
          project: publicProject,
          projectRole: null,
          cases: [[generateUploadUrl, false]]
        }
      ]
    },
    {
      user: unaffiliatedUser,
      projectData: [
        {
          project: ownedProject,
          projectRole: null,
          cases: [[generateUploadUrl, false]]
        },
        {
          project: contributorProject,
          projectRole: null,
          cases: [[generateUploadUrl, false]]
        },
        {
          project: reviewerProject,
          projectRole: null,
          cases: [[generateUploadUrl, false]]
        },
        {
          project: noAccessProject,
          projectRole: null,
          cases: [[generateUploadUrl, false]]
        },
        {
          project: publicProject,
          projectRole: null,
          cases: [[generateUploadUrl, false]]
        }
      ]
    },
    {
      user: null,
      projectData: [
        {
          project: ownedProject,
          projectRole: null,
          cases: [[generateUploadUrl, false]]
        },
        {
          project: contributorProject,
          projectRole: null,
          cases: [[generateUploadUrl, false]]
        },
        {
          project: reviewerProject,
          projectRole: null,
          cases: [[generateUploadUrl, false]]
        },
        {
          project: noAccessProject,
          projectRole: null,
          cases: [[generateUploadUrl, false]]
        },
        {
          project: publicProject,
          projectRole: null,
          cases: [[generateUploadUrl, false]]
        }
      ]
    }
  ]

  testData.forEach(async (userContext) => {
    const testUser = userContext.user

    describe(`User: ${testUser?.name ?? 'Anonymous'} as a ${
      testUser?.role ?? 'anonymous user'
    }`, async () => {
      let apollo: Awaited<ReturnType<typeof testApolloServer>>
      before(async () => {
        apollo = await testApolloServer({
          authUserId: testUser?.id
        })
      })

      userContext.projectData.forEach((projectContext) => {
        const project = projectContext.project
        const projectRole = projectContext.projectRole

        describe(`testing ${projectContext.cases.length} cases for project "${
          project.name
        }" where I, "${testUser?.name ?? 'anonymous'}", ${
          testUser && projectRole ? `have the role of ${projectRole}` : 'have no role'
        }`, () => {
          before(async () => {
            if (testUser && projectRole) {
              await grantPermissionsOnProject({
                projectId: project.id,
                userId: testUser.id,
                role: projectRole
              })
            }
          })

          projectContext.cases.forEach(([testCase, shouldSucceed]) => {
            it(`${shouldSucceed ? 'should' : 'should not be allowed to'} ${
              testCase.name
            }`, async () => {
              await testCase({
                apollo,
                projectId: project.id,
                fileName: `${cryptoRandomString({ length: 10 })}.${cryptoRandomString({
                  length: 3
                })}`,
                shouldSucceed
              })
            })
          })
        })
      })
    })
  })
})
