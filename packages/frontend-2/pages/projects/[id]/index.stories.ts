import { Meta, Story } from '@storybook/vue3'
import {
  ProjectLatestCommentThreadsQuery,
  ProjectLatestModelsQuery,
  ProjectModelChildrenTreeQuery,
  ProjectModelsTreeTopLevelQuery,
  ProjectPageQueryQuery
} from '~~/lib/common/generated/gql/graphql'
import { StorybookParameters } from '~~/lib/common/helpers/storybook'
import {
  latestCommentThreadsQuery,
  latestModelsQuery,
  projectModelChildrenTreeQuery,
  projectModelsTreeTopLevelQuery,
  projectPageQuery
} from '~~/lib/projects/graphql/queries'
import ProjectPage from '~~/pages/projects/[id]/index.vue'
import DefaultLayout from '~~/layouts/default.vue'
import { fakeUsers } from '~~/components/form/select/Users.stories'
import { Roles, SourceApps } from '@speckle/shared'
import { random, times } from 'lodash-es'
import { fakeScreenshot } from '~~/stories/helpers/comments'

const fakeProjectId = 'some-fake-id'

export default {
  title: 'Pages/Project',
  component: ProjectPage,
  parameters: {
    docs: {
      inlineStories: false,
      iframeHeight: 1000
    },
    layout: 'fullscreen'
  }
} as Meta

export const Default: Story = {
  render: (args) => ({
    components: { ProjectPage, DefaultLayout },
    setup: () => ({ args }),
    template: `<DefaultLayout><ProjectPage v-bind="args"/></DefaultLayout>`
  }),
  parameters: {
    apolloClient: {
      mocks: [
        {
          request: { query: projectPageQuery, variables: { id: fakeProjectId } },
          result: {
            data: {
              project: {
                __typename: 'Project',
                id: fakeProjectId,
                createdAt: new Date().toISOString(),
                name: 'Test project',
                description: 'Test project description',
                versionCount: 10,
                modelCount: 15,
                commentThreadCount: 20,
                sourceApps: SourceApps.map((s) => s.searchKey),
                team: fakeUsers,
                role: Roles.Stream.Owner
              }
            } as ProjectPageQueryQuery
          }
        },
        {
          request: {
            query: latestModelsQuery,
            variables: {
              projectId: fakeProjectId
            }
          },
          result: {
            data: {
              __typename: 'Query',
              project: {
                __typename: 'Project',
                id: fakeProjectId,
                models: {
                  __typename: 'ModelCollection',
                  totalCount: 15,
                  cursor: null,
                  items: times(8).map((i) => ({
                    __typename: 'Model',
                    id: `Model${i}`,
                    name: `Model #${i}`,
                    versionCount: Math.ceil(Math.random() * 10),
                    commentThreadCount: Math.ceil(Math.random() * 10),
                    previewUrl:
                      'https://latest.speckle.dev/preview/7d051a6449/commits/270741bd70',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                  }))
                }
              }
            } as ProjectLatestModelsQuery
          }
        },
        {
          request: {
            query: projectModelsTreeTopLevelQuery,
            variables: {
              projectId: fakeProjectId
            }
          },
          result: {
            data: {
              __typename: 'Query',
              project: {
                __typename: 'Project',
                id: fakeProjectId,
                modelsTree: times(3).map((i) => {
                  const name = `top level item #${i}`
                  const hasChildren = i === 1
                  const hasModel = i === 2
                  return {
                    __typename: 'ModelsTreeItem',
                    name,
                    fullName: name,
                    hasChildren,
                    updatedAt: new Date().toISOString(),
                    model: hasModel
                      ? {
                          __typename: 'Model',
                          id: `Model${i}`,
                          name: `Model #${i}`,
                          versionCount: Math.ceil(Math.random() * 10),
                          commentThreadCount: Math.ceil(Math.random() * 10),
                          previewUrl:
                            'https://latest.speckle.dev/preview/7d051a6449/commits/270741bd70',
                          createdAt: new Date().toISOString(),
                          updatedAt: new Date().toISOString()
                        }
                      : null
                  }
                })
              }
            } as ProjectModelsTreeTopLevelQuery
          }
        },
        {
          request: {
            query: projectModelChildrenTreeQuery,
            variables: {
              projectId: fakeProjectId,
              parentName: 'top level item #1'
            }
          },
          result: {
            data: {
              __typename: 'Query',
              project: {
                __typename: 'Project',
                id: fakeProjectId,
                modelChildrenTree: times(3).map((i) => {
                  const name = `child item ${i}`
                  return {
                    __typename: 'ModelsTreeItem',
                    name,
                    fullName: `top level item #1/${name}`,
                    hasChildren: false,
                    updatedAt: new Date().toISOString(),
                    model: {
                      __typename: 'Model',
                      id: `Model${i}`,
                      name: `Model #${i}`,
                      versionCount: Math.ceil(Math.random() * 10),
                      commentThreadCount: Math.ceil(Math.random() * 10),
                      previewUrl:
                        'https://latest.speckle.dev/preview/7d051a6449/commits/270741bd70',
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString()
                    }
                  }
                })
              }
            } as ProjectModelChildrenTreeQuery
          }
        },
        {
          request: {
            query: latestCommentThreadsQuery,
            variables: {
              projectId: fakeProjectId
            }
          },
          result: {
            data: {
              __typename: 'Query',
              project: {
                __typename: 'Project',
                id: fakeProjectId,
                commentThreads: {
                  __typename: 'CommentCollection',
                  totalCount: 20,
                  cursor: null,
                  items: times(6).map((i) => ({
                    __typename: 'Comment',
                    id: `Comment${i}`,
                    author: fakeUsers[random(fakeUsers.length - 1)],
                    screenshot: fakeScreenshot,
                    rawText:
                      'Hello there, this is an example comment text. Do you like it?',
                    createdAt: new Date().toISOString(),
                    repliesCount: 100,
                    replyAuthors: {
                      __typename: 'CommentReplyAuthorCollection',
                      items: fakeUsers.slice(0, 4),
                      totalCount: 100
                    }
                  }))
                }
              }
            } as ProjectLatestCommentThreadsQuery
          }
        }
      ]
    },
    vueRouter: {
      route: { params: { id: fakeProjectId } }
    }
  } as StorybookParameters
}

export const EmptyState: Story = {
  ...Default,
  parameters: {
    apolloClient: {
      mocks: [
        {
          request: { query: projectPageQuery, variables: { id: fakeProjectId } },
          result: {
            data: {
              project: {
                __typename: 'Project',
                id: fakeProjectId,
                createdAt: new Date().toISOString(),
                name: 'New Empty Project',
                description: null,
                versionCount: 0,
                modelCount: 1,
                commentThreadCount: 0,
                sourceApps: [],
                team: fakeUsers.slice(0, 1),
                role: Roles.Stream.Owner
              }
            } as ProjectPageQueryQuery
          }
        },
        {
          request: {
            query: latestModelsQuery,
            variables: {
              projectId: fakeProjectId,
              filter: { sourceApps: null, contributors: null }
            }
          },
          result: {
            data: {
              __typename: 'Query',
              project: {
                __typename: 'Project',
                id: fakeProjectId,
                models: {
                  __typename: 'ModelCollection',
                  totalCount: 1,
                  cursor: null,
                  items: [
                    {
                      __typename: 'Model',
                      id: `Model1`,
                      name: `main`,
                      versionCount: 0,
                      commentThreadCount: 0,
                      previewUrl:
                        'https://latest.speckle.dev/preview/7d051a6449/commits/270741bd70',
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString()
                    }
                  ]
                }
              }
            } as ProjectLatestModelsQuery
          }
        },
        {
          request: {
            query: latestCommentThreadsQuery,
            variables: {
              projectId: fakeProjectId
            }
          },
          result: {
            data: {
              __typename: 'Query',
              project: {
                __typename: 'Project',
                id: fakeProjectId,
                commentThreads: {
                  __typename: 'CommentCollection',
                  totalCount: 0,
                  cursor: null,
                  items: []
                }
              }
            } as ProjectLatestCommentThreadsQuery
          }
        }
      ]
    },
    vueRouter: {
      route: { params: { id: fakeProjectId } }
    }
  } as StorybookParameters
}
