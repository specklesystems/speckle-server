import { createTestUser } from '@/test/authHelper'
import type { ExecuteOperationResponse } from '@/test/graphqlHelper'
import { testApolloServer } from '@/test/graphqlHelper'
import { beforeEachContext } from '@/test/hooks'
import { createProject, grantProjectPermissions } from '@/test/projectHelper'
import type { BasicTestBranch } from '@/test/speckle-helpers/branchHelper'
import { createTestBranch } from '@/test/speckle-helpers/branchHelper'
import type { Nullable, Optional, ServerRoles, StreamRoles } from '@speckle/shared'
import { Roles } from '@speckle/shared'
import axios from 'axios'
import { expect } from 'chai'
import cryptoRandomString from 'crypto-random-string'
import gql from 'graphql-tag'
import type { SetNonNullable } from 'type-fest'
import { getFeatureFlags } from '@speckle/shared/environment'

const { FF_LARGE_FILE_IMPORTS_ENABLED } = getFeatureFlags()

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
  userId: Optional<string>
  fileName: string
}

const FILE_TYPE = 'obj'

const generateUploadUrl = async (params: TestContext) => {
  const { apollo, projectId, fileName, shouldSucceed } = params
  const res = await apollo.execute(
    gql`
      mutation ($input: GenerateFileUploadUrlInput!) {
        fileUploadMutations {
          generateUploadUrl(input: $input) {
            url
            fileId
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
    expect(res.data.fileUploadMutations.generateUploadUrl.fileId).to.be.string
    expect(res.data.fileUploadMutations.generateUploadUrl.fileId.length).to.equal(10)
    expect(res.data.fileUploadMutations.generateUploadUrl.url).to.be.string
    expect(res.data.fileUploadMutations.generateUploadUrl.url).to.be.not.empty
    expect(res.data.fileUploadMutations.generateUploadUrl.url).to.contain(projectId)
    expect(
      res.data.fileUploadMutations.generateUploadUrl.url,
      res.data.fileUploadMutations.generateUploadUrl.url
    ).to.contain(res.data.fileUploadMutations.generateUploadUrl.fileId)
  })
}

const startFileImport = async (params: TestContext) => {
  const { apollo, projectId, userId, fileName, shouldSucceed } = params

  let fileId = cryptoRandomString({ length: 10 })
  let etag = cryptoRandomString({ length: 32 })
  const model: BasicTestBranch = {
    name: cryptoRandomString({ length: 10 }),
    id: '',
    streamId: '',
    authorId: ''
  }

  // we want the auth test to check the registerCompletedUpload,
  // so we will only prepare the upload URL if we expect the test to succeed
  if (shouldSucceed) {
    const uploadDetails = await apollo.execute(
      gql`
        mutation ($input: GenerateFileUploadUrlInput!) {
          fileUploadMutations {
            generateUploadUrl(input: $input) {
              url
              fileId
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

    if (!uploadDetails.data) {
      expect(true, `Upload details are undefined: ${JSON.stringify(uploadDetails)}`).to
        .be.false
      return //HACK to make typescript happy
    }

    fileId = uploadDetails.data.fileUploadMutations.generateUploadUrl.fileId

    const putResult = await axios.put(
      uploadDetails.data.fileUploadMutations.generateUploadUrl.url,
      cryptoRandomString({ length: 100 }) //test content
    )
    expect(putResult.status).to.equal(200)
    etag = putResult.headers.etag

    if (userId) {
      await createTestBranch({
        branch: model,
        stream: {
          id: projectId,
          name: '', //ignored
          isPublic: false, //ignored
          ownerId: '' //ignored
        },
        owner: {
          name: '', //ignored
          email: '', //ignored
          id: userId
        }
      })
    }
  }

  const res = await apollo.execute(
    gql`
      mutation ($input: StartFileImportInput!) {
        fileUploadMutations {
          startFileImport(input: $input) {
            id
            fileSize
            fileType
            streamId
            userId
          }
        }
      }
    `,
    {
      input: {
        projectId,
        modelId: model.id,
        fileId,
        etag
      }
    }
  )

  testResult(shouldSucceed, res, (res) => {
    expect(res.data.fileUploadMutations.startFileImport.id).to.be.string
    expect(res.data.fileUploadMutations.startFileImport.id).to.equal(fileId)
    expect(res.data.fileUploadMutations.startFileImport.fileSize).to.equal(100)
    expect(res.data.fileUploadMutations.startFileImport.fileType).to.equal(FILE_TYPE)
  })
}

;(FF_LARGE_FILE_IMPORTS_ENABLED ? describe : describe.skip)(
  'Presigned graph @fileuploads',
  async () => {
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

    const testData: {
      user: Nullable<{ id: string; name: string; role: ServerRoles }>
      projectData: {
        project: { id: string; name: string; isPublic: boolean }
        projectRole: Nullable<StreamRoles>
        cases: {
          testCase: (params: TestContext) => Promise<void>
          shouldSucceed: boolean
        }[]
      }[]
    }[] = <const>[
      {
        user: regularServerUser,
        projectData: [
          {
            project: ownedProject,
            projectRole: Roles.Stream.Owner,
            cases: [
              { testCase: generateUploadUrl, shouldSucceed: true },
              { testCase: startFileImport, shouldSucceed: true }
            ]
          },
          {
            project: contributorProject,
            projectRole: Roles.Stream.Contributor,
            cases: [
              { testCase: generateUploadUrl, shouldSucceed: true },
              { testCase: startFileImport, shouldSucceed: true }
            ]
          },
          {
            project: reviewerProject,
            projectRole: Roles.Stream.Reviewer,
            cases: [
              { testCase: generateUploadUrl, shouldSucceed: false },
              { testCase: startFileImport, shouldSucceed: false }
            ]
          },
          {
            project: noAccessProject,
            projectRole: null,
            cases: [
              { testCase: generateUploadUrl, shouldSucceed: false },
              { testCase: startFileImport, shouldSucceed: false }
            ]
          },
          {
            project: publicProject,
            projectRole: null,
            cases: [
              { testCase: generateUploadUrl, shouldSucceed: false },
              { testCase: startFileImport, shouldSucceed: false }
            ]
          }
        ]
      },
      {
        user: archivedUser,
        projectData: [
          {
            project: ownedProject,
            projectRole: Roles.Stream.Owner,
            cases: [
              { testCase: generateUploadUrl, shouldSucceed: false },
              { testCase: startFileImport, shouldSucceed: false }
            ]
          },
          {
            project: contributorProject,
            projectRole: Roles.Stream.Contributor,
            cases: [
              { testCase: generateUploadUrl, shouldSucceed: false },
              { testCase: startFileImport, shouldSucceed: false }
            ]
          },
          {
            project: reviewerProject,
            projectRole: Roles.Stream.Reviewer,
            cases: [
              { testCase: generateUploadUrl, shouldSucceed: false },
              { testCase: startFileImport, shouldSucceed: false }
            ]
          },
          {
            project: noAccessProject,
            projectRole: null,
            cases: [
              { testCase: generateUploadUrl, shouldSucceed: false },
              { testCase: startFileImport, shouldSucceed: false }
            ]
          },
          {
            project: publicProject,
            projectRole: null,
            cases: [
              { testCase: generateUploadUrl, shouldSucceed: false },
              { testCase: startFileImport, shouldSucceed: false }
            ]
          }
        ]
      },
      {
        user: unaffiliatedUser,
        projectData: [
          {
            project: ownedProject,
            projectRole: null,
            cases: [
              { testCase: generateUploadUrl, shouldSucceed: false },
              { testCase: startFileImport, shouldSucceed: false }
            ]
          },
          {
            project: contributorProject,
            projectRole: null,
            cases: [
              { testCase: generateUploadUrl, shouldSucceed: false },
              { testCase: startFileImport, shouldSucceed: false }
            ]
          },
          {
            project: reviewerProject,
            projectRole: null,
            cases: [
              { testCase: generateUploadUrl, shouldSucceed: false },
              { testCase: startFileImport, shouldSucceed: false }
            ]
          },
          {
            project: noAccessProject,
            projectRole: null,
            cases: [
              { testCase: generateUploadUrl, shouldSucceed: false },
              { testCase: startFileImport, shouldSucceed: false }
            ]
          },
          {
            project: publicProject,
            projectRole: null,
            cases: [
              { testCase: generateUploadUrl, shouldSucceed: false },
              { testCase: startFileImport, shouldSucceed: false }
            ]
          }
        ]
      },
      {
        user: null,
        projectData: [
          {
            project: ownedProject,
            projectRole: null,
            cases: [
              { testCase: generateUploadUrl, shouldSucceed: false },
              { testCase: startFileImport, shouldSucceed: false }
            ]
          },
          {
            project: contributorProject,
            projectRole: null,
            cases: [
              { testCase: generateUploadUrl, shouldSucceed: false },
              { testCase: startFileImport, shouldSucceed: false }
            ]
          },
          {
            project: reviewerProject,
            projectRole: null,
            cases: [
              { testCase: generateUploadUrl, shouldSucceed: false },
              { testCase: startFileImport, shouldSucceed: false }
            ]
          },
          {
            project: noAccessProject,
            projectRole: null,
            cases: [
              { testCase: generateUploadUrl, shouldSucceed: false },
              { testCase: startFileImport, shouldSucceed: false }
            ]
          },
          {
            project: publicProject,
            projectRole: null,
            cases: [
              { testCase: generateUploadUrl, shouldSucceed: false },
              { testCase: startFileImport, shouldSucceed: false }
            ]
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
                await grantProjectPermissions({
                  projectId: project.id,
                  userId: testUser.id,
                  role: projectRole
                })
              }
            })

            projectContext.cases.forEach((value) => {
              it(`${value.shouldSucceed ? 'should' : 'should not be allowed to'} ${
                value.testCase.name
              }`, async () => {
                await value.testCase({
                  apollo,
                  projectId: project.id,
                  userId: testUser?.id,
                  fileName: `${cryptoRandomString({ length: 10 })}.${FILE_TYPE}`,
                  shouldSucceed: value.shouldSucceed
                })
              })
            })
          })
        })
      })
    })
  }
)
