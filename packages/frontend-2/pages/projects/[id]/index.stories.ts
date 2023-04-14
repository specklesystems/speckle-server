import { Meta, StoryObj } from '@storybook/vue3'
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
import { StorybookParameters } from '~~/lib/common/helpers/storybook'
import ProjectPage from '~~/pages/projects/[id]/index.vue'
import DefaultLayout from '~~/layouts/default.vue'
import { fakeUsers } from '~~/components/form/select/Users.stories'
import { Roles, SourceApps } from '@speckle/shared'
import { random, times } from 'lodash-es'
import { fakeScreenshot } from '~~/stories/helpers/comments'
import { MockedApolloRequest } from '~~/lib/fake-nuxt-env/utils/betterMockLink'

/**
 * TODO: Migrate all stores to new requests
 * - Create utilities for easily creating responses
 */

const fakeProjectId = 'some-fake-id'
const randomDate = new Date('01-01-2023')
const randomPreviewUrl =
  'https://latest.speckle.dev/preview/7d051a6449/commits/270741bd70'

export default {
  title: 'Pages/Project',
  component: ProjectPage,
  parameters: {
    docs: {
      story: {
        inline: false,
        iframeHeight: 1000
      }
    },
    layout: 'fullscreen',
    manualLayout: true
  }
} as Meta

export const Default: StoryObj = {
  render: (args) => ({
    components: { ProjectPage, DefaultLayout },
    setup: () => ({ args }),
    template: `<DefaultLayout><ProjectPage v-bind="args"/></DefaultLayout>`
  }),
  parameters: {
    apolloClient: {
      mocks: [
        // Main project page metadata
        {
          request: ({ operationName }) => operationName === 'ProjectPageQuery',
          result: ({ variables }) => ({
            data: {
              project: {
                __typename: 'Project',
                id: variables.id,
                createdAt: randomDate.toISOString(),
                name: `Test project #${variables.id}`,
                description: 'Test project description',
                visibility: ProjectVisibility.Public,
                allowPublicComments: true,
                role: Roles.Stream.Owner,
                commentThreadCount: {
                  __typename: 'ProjectCommentCollection',
                  totalCount: 20
                },
                versionCount: {
                  __typename: 'VersionCollection',
                  totalCount: 15
                },
                modelCount: {
                  __typename: 'ModelCollection',
                  totalCount: 10
                },
                sourceApps: SourceApps.map((s) => s.searchKey),
                team: fakeUsers.map((u) => ({
                  role: Roles.Stream.Contributor,
                  user: u
                })),
                invitedTeam: null
              },
              projectInvite: null
            }
          })
        } as MockedApolloRequest<ProjectPageQueryQuery, ProjectPageQueryQueryVariables>,
        // Latest models - grid view
        {
          request: ({ operationName }) => operationName === 'ProjectLatestModels',
          result: ({ variables }) => {
            const search = variables.filter?.search
            const sourceApps = variables.filter?.sourceApps
            const contributors = variables.filter?.contributors

            let resultCount = 20
            if (search?.length) resultCount = 8
            if (sourceApps?.length || contributors?.length) resultCount = 5

            return {
              data: {
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
                        totalCount: 15
                      },
                      commentThreadCount: {
                        totalCount: 15
                      },
                      previewUrl: randomPreviewUrl,
                      createdAt: randomDate.toISOString(),
                      updatedAt: randomDate.toISOString,
                      pendingImportedVersions: []
                    }))
                  },
                  pendingImportedModels: []
                }
              }
            }
          }
        } as MockedApolloRequest<
          ProjectLatestModelsQuery,
          ProjectLatestModelsQueryVariables
        >,
        // Latest models - list view
        {
          request: ({ operationName }) => operationName === 'ProjectModelsTreeTopLevel',
          result: ({ variables }) => {
            const search = variables.filter?.search
            const sourceApps = variables.filter?.sourceApps
            const contributors = variables.filter?.contributors

            let resultCount = 8
            if (search?.length) resultCount = 5
            if (sourceApps?.length || contributors?.length) resultCount = 3

            return {
              data: {
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
                              versionCount: {
                                totalCount: 16
                              },
                              commentThreadCount: {
                                totalCount: 20
                              },
                              previewUrl: randomPreviewUrl,
                              createdAt: randomDate.toISOString(),
                              updatedAt: randomDate.toISOString(),
                              pendingImportedVersions: []
                            }
                          : null
                      }
                    })
                  }
                }
              }
            }
          }
        } as MockedApolloRequest<
          ProjectModelsTreeTopLevelQuery,
          ProjectModelsTreeTopLevelQueryVariables
        >,
        // Latest models - list view - children
        {
          request: ({ operationName }) => operationName === 'ProjectModelChildrenTree',
          result: ({ variables }) => ({
            data: {
              project: {
                __typename: 'Project',
                id: variables.projectId,
                modelChildrenTree: times(3, (i) => {
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
                        totalCount: 16
                      },
                      commentThreadCount: {
                        totalCount: 20
                      },
                      pendingImportedVersions: [],
                      previewUrl: randomPreviewUrl,
                      createdAt: randomDate.toISOString(),
                      updatedAt: randomDate.toISOString()
                    }
                  }
                })
              }
            }
          })
        } as MockedApolloRequest<
          ProjectModelChildrenTreeQuery,
          ProjectModelChildrenTreeQueryVariables
        >,
        {
          request: ({ operationName }) =>
            operationName === 'ProjectLatestCommentThreads',
          result: ({ variables }) => {
            const includeArchived = variables.filter?.includeArchived

            let resultCount = 4
            if (includeArchived) resultCount = 8

            return {
              data: {
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
                      author: fakeUsers[random(fakeUsers.length - 1)],
                      screenshot: fakeScreenshot,
                      rawText:
                        'Hello there, this is an example comment text. Do you like it?',
                      createdAt: randomDate.toISOString(),
                      updatedAt: randomDate.toISOString(),
                      repliesCount: {
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
            }
          }
        } as MockedApolloRequest<
          ProjectLatestCommentThreadsQuery,
          ProjectLatestCommentThreadsQueryVariables
        >
      ]
    },
    vueRouter: {
      route: { params: { id: fakeProjectId }, query: {} }
    }
  } as StorybookParameters
}

export const Default2: StoryObj = {
  render: (args) => ({
    components: { ProjectPage, DefaultLayout },
    setup: () => ({ args }),
    template: `<DefaultLayout><ProjectPage v-bind="args"/></DefaultLayout>`
  }),
  parameters: {
    // apolloClient: {
    //   mocks: [
    //     // Main project page query
    //     {
    //       request: {
    //         query: projectPageQuery,
    //         variables: { id: fakeProjectId, token: null }
    //       },
    //       result: {
    //         data: {
    //           project: {
    //             __typename: 'Project',
    //             id: fakeProjectId,
    //             createdAt: new Date().toISOString(),
    //             name: 'Test project',
    //             description: 'Test project description',
    //             visibility: ProjectVisibility.Public,
    //             allowPublicComments: true,
    //             role: Roles.Stream.Owner,
    //             commentThreadCount: {
    //               totalCount: 20
    //             },
    //             versionCount: {
    //               totalCount: 15
    //             },
    //             modelCount: {
    //               totalCount: 10
    //             },
    //             sourceApps: SourceApps.map((s) => s.searchKey),
    //             team: fakeUsers.map((u) => ({
    //               role: Roles.Stream.Contributor,
    //               user: u
    //             })),
    //             invitedTeam: null
    //           },
    //           projectInvite: null
    //         } as ProjectPageQueryQuery
    //       }
    //     },
    //     // Grid view - no search
    //     {
    //       request: {
    //         query: latestModelsQuery,
    //         variables: {
    //           projectId: fakeProjectId,
    //           filter: {
    //             search: null
    //           }
    //         }
    //       },
    //       result: {
    //         data: {
    //           __typename: 'Query',
    //           project: {
    //             __typename: 'Project',
    //             id: fakeProjectId,
    //             models: {
    //               __typename: 'ModelCollection',
    //               totalCount: 15,
    //               cursor: null,
    //               items: times(8).map((i) => ({
    //                 __typename: 'Model',
    //                 id: `Model${i}`,
    //                 name: `Model #${i}`,
    //                 displayName: `Model #${i}`,
    //                 versionCount: {
    //                   totalCount: Math.ceil(Math.random() * 10)
    //                 },
    //                 commentThreadCount: {
    //                   totalCount: Math.ceil(Math.random() * 10)
    //                 },
    //                 previewUrl:
    //                   'https://latest.speckle.dev/preview/7d051a6449/commits/270741bd70',
    //                 createdAt: new Date().toISOString(),
    //                 updatedAt: new Date().toISOString()
    //               }))
    //             }
    //           }
    //         } as ProjectLatestModelsQuery
    //       }
    //     },
    //     // Structured view - top level
    //     {
    //       request: {
    //         query: projectModelsTreeTopLevelQuery,
    //         variables: {
    //           projectId: fakeProjectId
    //         }
    //       },
    //       result: {
    //         data: {
    //           __typename: 'Query',
    //           project: {
    //             __typename: 'Project',
    //             id: fakeProjectId,
    //             modelsTree: times(3).map((i) => {
    //               const name = `top level item #${i}`
    //               const hasChildren = i === 1
    //               const hasModel = i === 2
    //               return {
    //                 __typename: 'ModelsTreeItem',
    //                 name,
    //                 fullName: name,
    //                 hasChildren,
    //                 updatedAt: new Date().toISOString(),
    //                 model: hasModel
    //                   ? {
    //                       __typename: 'Model',
    //                       id: `Model${i}`,
    //                       name: `Model #${i}`,
    //                       versionCount: {
    //                         totalCount: Math.ceil(Math.random() * 10)
    //                       },
    //                       commentThreadCount: {
    //                         totalCount: Math.ceil(Math.random() * 10)
    //                       },
    //                       previewUrl:
    //                         'https://latest.speckle.dev/preview/7d051a6449/commits/270741bd70',
    //                       createdAt: new Date().toISOString(),
    //                       updatedAt: new Date().toISOString()
    //                     }
    //                   : null
    //               }
    //             })
    //           }
    //         } as ProjectModelsTreeTopLevelQuery
    //       }
    //     },
    //     // Structured view - children
    //     {
    //       request: {
    //         query: projectModelChildrenTreeQuery,
    //         variables: {
    //           projectId: fakeProjectId,
    //           parentName: 'top level item #1'
    //         }
    //       },
    //       result: {
    //         data: {
    //           __typename: 'Query',
    //           project: {
    //             __typename: 'Project',
    //             id: fakeProjectId,
    //             modelChildrenTree: times(3).map((i) => {
    //               const name = `child item ${i}`
    //               return {
    //                 __typename: 'ModelsTreeItem',
    //                 id: `${fakeProjectId}/ModelsTreeItem/${i}`,
    //                 name,
    //                 fullName: `top level item #1/${name}`,
    //                 hasChildren: false,
    //                 updatedAt: new Date().toISOString(),
    //                 model: {
    //                   __typename: 'Model',
    //                   id: `Model${i}`,
    //                   name: `Model #${i}`,
    //                   displayName: `Model #${i}`,
    //                   versionCount: {
    //                     totalCount: Math.ceil(Math.random() * 10)
    //                   },
    //                   commentThreadCount: {
    //                     totalCount: Math.ceil(Math.random() * 10)
    //                   },
    //                   previewUrl:
    //                     'https://latest.speckle.dev/preview/7d051a6449/commits/270741bd70',
    //                   createdAt: new Date().toISOString(),
    //                   updatedAt: new Date().toISOString()
    //                 }
    //               }
    //             })
    //           }
    //         } as ProjectModelChildrenTreeQuery
    //       }
    //     },
    //     // Latest comments
    //     {
    //       request: {
    //         query: latestCommentThreadsQuery,
    //         variables: {
    //           projectId: fakeProjectId
    //         }
    //       },
    //       result: {
    //         data: {
    //           __typename: 'Query',
    //           project: {
    //             __typename: 'Project',
    //             id: fakeProjectId,
    //             commentThreads: {
    //               __typename: 'ProjectCommentCollection',
    //               totalCount: 20,
    //               cursor: null,
    //               items: times(6).map((i) => ({
    //                 __typename: 'Comment',
    //                 id: `Comment${i}`,
    //                 author: fakeUsers[random(fakeUsers.length - 1)],
    //                 screenshot: fakeScreenshot,
    //                 rawText:
    //                   'Hello there, this is an example comment text. Do you like it?',
    //                 createdAt: new Date().toISOString(),
    //                 repliesCount: {
    //                   totalCount: 100
    //                 },
    //                 replyAuthors: {
    //                   __typename: 'CommentReplyAuthorCollection',
    //                   items: fakeUsers.slice(0, 4),
    //                   totalCount: 100
    //                 },
    //                 viewerResources: []
    //               }))
    //             }
    //           }
    //         } as ProjectLatestCommentThreadsQuery
    //       }
    //     }
    //   ]
    // },
    vueRouter: {
      route: { params: { id: fakeProjectId }, query: {} }
    }
  } as StorybookParameters
}

export const EmptyState: StoryObj = {
  ...Default,
  parameters: {
    // apolloClient: {
    //   mocks: [
    //     {
    //       request: {
    //         query: projectPageQuery,
    //         variables: { id: fakeProjectId, token: null }
    //       },
    //       result: {
    //         data: {
    //           project: {
    //             __typename: 'Project',
    //             id: fakeProjectId,
    //             createdAt: new Date().toISOString(),
    //             name: 'New Empty Project',
    //             description: null,
    //             visibility: ProjectVisibility.Public,
    //             allowPublicComments: true,
    //             versionCount: {
    //               totalCount: 0
    //             },
    //             modelCount: {
    //               totalCount: 1
    //             },
    //             commentThreadCount: {
    //               totalCount: 0
    //             },
    //             sourceApps: [],
    //             team: fakeUsers.slice(0, 1).map((u) => ({
    //               role: Roles.Stream.Contributor,
    //               user: u
    //             })),
    //             role: Roles.Stream.Owner,
    //             invitedTeam: null
    //           },
    //           projectInvite: null
    //         } as ProjectPageQueryQuery
    //       }
    //     },
    //     {
    //       request: {
    //         query: latestModelsQuery,
    //         variables: {
    //           projectId: fakeProjectId,
    //           filter: { sourceApps: null, contributors: null }
    //         }
    //       },
    //       result: {
    //         data: {
    //           __typename: 'Query',
    //           project: {
    //             __typename: 'Project',
    //             id: fakeProjectId,
    //             models: {
    //               __typename: 'ModelCollection',
    //               totalCount: 1,
    //               cursor: null,
    //               items: [
    //                 {
    //                   __typename: 'Model',
    //                   id: `Model1`,
    //                   name: `main`,
    //                   versionCount: {
    //                     totalCount: 0
    //                   },
    //                   commentThreadCount: {
    //                     totalCount: 0
    //                   },
    //                   previewUrl:
    //                     'https://latest.speckle.dev/preview/7d051a6449/commits/270741bd70',
    //                   createdAt: new Date().toISOString(),
    //                   updatedAt: new Date().toISOString()
    //                 }
    //               ]
    //             }
    //           }
    //         } as ProjectLatestModelsQuery
    //       }
    //     },
    //     {
    //       request: {
    //         query: latestCommentThreadsQuery,
    //         variables: {
    //           projectId: fakeProjectId
    //         }
    //       },
    //       result: {
    //         data: {
    //           __typename: 'Query',
    //           project: {
    //             __typename: 'Project',
    //             id: fakeProjectId,
    //             commentThreads: {
    //               __typename: 'ProjectCommentCollection',
    //               totalCount: 0,
    //               cursor: null,
    //               items: []
    //             }
    //           }
    //         } as ProjectLatestCommentThreadsQuery
    //       }
    //     }
    //   ]
    // },
    vueRouter: {
      route: { params: { id: fakeProjectId }, query: {} }
    }
  } as StorybookParameters
}
