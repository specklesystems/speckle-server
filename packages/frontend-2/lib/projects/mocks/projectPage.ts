import { FetchResult } from '@apollo/client/core'
import { Optional, Roles } from '@speckle/shared'
import {
  ProjectLatestCommentThreadsQuery,
  ProjectLatestCommentThreadsQueryVariables,
  ProjectLatestModelsQuery,
  ProjectLatestModelsQueryVariables,
  ProjectModelChildrenTreeQuery,
  ProjectModelChildrenTreeQueryVariables,
  ProjectModelsTreeTopLevelQuery,
  ProjectModelsTreeTopLevelQueryVariables,
  ProjectPageQueryQuery,
  ProjectPageQueryQueryVariables,
  ProjectVisibility
} from '~~/lib/common/generated/gql/graphql'
import { ApolloMockData } from '~~/lib/common/helpers/storybook'
import { apolloMockRequestWithDefaults } from '~~/lib/fake-nuxt-env/utils/betterMockLink'
import { fakeUsers } from '~~/components/form/select/Users.stories'
import { isNumber, times } from 'lodash-es'
import { fakeScreenshot } from '~~/stories/helpers/comments'

const randomDate = new Date('01-01-2020')
const randomPreviewUrl =
  'https://latest.speckle.dev/preview/7d051a6449/commits/270741bd70'

export const mockProjectPageQuery = apolloMockRequestWithDefaults<
  ProjectPageQueryQuery,
  ProjectPageQueryQueryVariables,
  Optional<
    Partial<{ commentThreadCount: number; versionCount: number; modelCount: number }>
  >
>({
  request: ({ operationName }) => operationName === 'ProjectPageQuery',
  result: (input, values): FetchResult<ApolloMockData<ProjectPageQueryQuery>> => {
    return {
      data: {
        project: {
          __typename: 'Project',
          id: input.variables.id,
          createdAt: randomDate.toISOString(),
          name: `Test project #${input.variables.id}`,
          description: 'Test project description',
          visibility: ProjectVisibility.Public,
          allowPublicComments: true,
          role: Roles.Stream.Owner,
          commentThreadCount: {
            __typename: 'ProjectCommentCollection',
            totalCount: values?.commentThreadCount ?? 20
          },
          versionCount: {
            __typename: 'VersionCollection',
            totalCount: values?.versionCount ?? 15
          },
          modelCount: {
            __typename: 'ModelCollection',
            totalCount: values?.modelCount ?? 10
          },
          team: fakeUsers.map((u) => ({
            __typename: 'ProjectCollaborator',
            role: Roles.Stream.Contributor,
            user: {
              ...u,
              role: Roles.Server.User
            }
          })),
          invitedTeam: null
        },
        projectInvite: null,
        __typename: 'Query'
      }
    }
  }
})

export const mockProjectLatestModelsQuery = apolloMockRequestWithDefaults<
  ProjectLatestModelsQuery,
  ProjectLatestModelsQueryVariables,
  Optional<Partial<{ resultCount: number }>>
>({
  request: ({ operationName }) => operationName === 'ProjectLatestModels',
  result: ({ variables }, values) => {
    const search = variables.filter?.search
    const sourceApps = variables.filter?.sourceApps
    const contributors = variables.filter?.contributors

    let resultCount = 20
    if (search?.length) resultCount = 8
    if (sourceApps?.length || contributors?.length) resultCount = 5
    if ((search?.length || 0) > 10) resultCount = 0
    if (values && isNumber(values?.resultCount)) resultCount = values.resultCount

    const data: ApolloMockData<ProjectLatestModelsQuery> = {
      __typename: 'Query',
      project: {
        __typename: 'Project',
        id: variables.projectId,
        models: {
          __typename: 'ModelCollection',
          totalCount: resultCount,
          cursor: null,
          items: times(resultCount).map((i) => ({
            __typename: 'Model',
            id: `model-${i}`,
            name: `Model ${i}`,
            displayName: `Model ${i}`,
            versionCount: {
              __typename: 'VersionCollection',
              totalCount: 15
            },
            commentThreadCount: {
              __typename: 'CommentCollection',
              totalCount: 15
            },
            previewUrl: randomPreviewUrl,
            createdAt: randomDate.toISOString(),
            updatedAt: randomDate.toISOString(),
            pendingImportedVersions: [],
            automationStatus: null
          }))
        },
        pendingImportedModels: []
      }
    }

    return {
      data
    }
  }
})

export const mockProjectModelsTreeTopLevelQuery = apolloMockRequestWithDefaults<
  ProjectModelsTreeTopLevelQuery,
  ProjectModelsTreeTopLevelQueryVariables,
  Optional<Partial<{ resultCount: number }>>
>({
  request: ({ operationName }) => operationName === 'ProjectModelsTreeTopLevel',
  result: ({ variables }, values) => {
    const search = variables.filter?.search
    const sourceApps = variables.filter?.sourceApps
    const contributors = variables.filter?.contributors

    let resultCount = 20
    if (search?.length) resultCount = 8
    if (sourceApps?.length || contributors?.length) resultCount = 5
    if ((search?.length || 0) > 10) resultCount = 0
    if (values && isNumber(values?.resultCount)) resultCount = values.resultCount

    return {
      data: {
        __typename: 'Query',
        project: {
          __typename: 'Project',
          id: variables.projectId,
          modelsTree: {
            __typename: 'ModelsTreeItemCollection',
            totalCount: resultCount,
            cursor: null,
            items: times(resultCount, (i) => {
              const name = `Top level item ${i}`
              const hasChildren = i % 3 === 0
              const hasModel = i % 6 === 0

              return {
                __typename: 'ModelsTreeItem',
                name,
                id: `ModelsTreeItem-${i}`,
                fullName: name,
                hasChildren,
                updatedAt: randomDate.toISOString(),
                model: hasModel
                  ? {
                      __typename: 'Model',
                      id: `model-${name}`,
                      name,
                      displayName: name,
                      versionCount: {
                        __typename: 'VersionCollection',
                        totalCount: 16
                      },
                      commentThreadCount: {
                        __typename: 'CommentCollection',
                        totalCount: 20
                      },
                      previewUrl: randomPreviewUrl,
                      createdAt: randomDate.toISOString(),
                      updatedAt: randomDate.toISOString(),
                      pendingImportedVersions: [],
                      automationStatus: null
                    }
                  : null
              }
            })
          },
          pendingImportedModels: []
        }
      }
    }
  }
})

export const mockProjectModelChildrenTreeQuery = apolloMockRequestWithDefaults<
  ProjectModelChildrenTreeQuery,
  ProjectModelChildrenTreeQueryVariables,
  Optional<Partial<{ resultCount: number }>>
>({
  request: ({ operationName }) => operationName === 'ProjectModelChildrenTree',
  result: ({ variables }, values) => ({
    data: {
      __typename: 'Query',
      project: {
        __typename: 'Project',
        id: variables.projectId,
        modelChildrenTree: times(values?.resultCount ?? 3, (i) => {
          const name = `Child item ${i}`
          return {
            __typename: 'ModelsTreeItem',
            id: `ModelsTreeItem-child-${variables.parentName}-${i}`,
            name,
            fullName: `${variables.parentName}/${name}`,
            hasChildren: false,
            updatedAt: randomDate.toISOString(),
            model: {
              __typename: 'Model',
              id: `model-child-${name}`,
              name: `${variables.parentName}/Child model ${i}`,
              displayName: `Child model ${i}`,
              versionCount: {
                __typename: 'VersionCollection',
                totalCount: 16
              },
              commentThreadCount: {
                __typename: 'CommentCollection',
                totalCount: 20
              },
              pendingImportedVersions: [],
              previewUrl: randomPreviewUrl,
              createdAt: randomDate.toISOString(),
              updatedAt: randomDate.toISOString(),
              automationStatus: null
            }
          }
        })
      }
    }
  })
})

export const mockProjectLatestCommentThreadsQuery = apolloMockRequestWithDefaults<
  ProjectLatestCommentThreadsQuery,
  ProjectLatestCommentThreadsQueryVariables,
  Optional<Partial<{ resultCount: number }>>
>({
  request: ({ operationName }) => operationName === 'ProjectLatestCommentThreads',
  result: ({ variables }, values) => {
    const includeArchived = variables.filter?.includeArchived

    let resultCount = 4
    if (includeArchived) resultCount = 8
    if (values && isNumber(values.resultCount)) resultCount = values.resultCount

    const data: ApolloMockData<ProjectLatestCommentThreadsQuery> = {
      __typename: 'Query',
      project: {
        __typename: 'Project',
        id: variables.projectId,
        commentThreads: {
          __typename: 'ProjectCommentCollection',
          totalCount: resultCount,
          cursor: null,
          items: times(resultCount, (i) => ({
            __typename: 'Comment',
            id: `comment-${i}`,
            author: fakeUsers[5],
            screenshot: fakeScreenshot,
            rawText: 'Hello there, this is an example comment text. Do you like it?',
            createdAt: randomDate.toISOString(),
            updatedAt: randomDate.toISOString(),
            repliesCount: {
              __typename: 'CommentCollection',
              totalCount: 100
            },
            replyAuthors: {
              __typename: 'CommentReplyAuthorCollection',
              items: fakeUsers.slice(0, 4),
              totalCount: 100
            },
            archived: false,
            viewerResources: []
          }))
        }
      }
    }

    return { data }
  }
})
