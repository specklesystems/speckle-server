import { Meta, Story } from '@storybook/vue3'
import {
  ProjectLatestModelsQuery,
  ProjectPageQueryQuery
} from '~~/lib/common/generated/gql/graphql'
import { StorybookParameters } from '~~/lib/common/helpers/storybook'
import { latestModelsQuery, projectPageQuery } from '~~/lib/projects/graphql/queries'
import ProjectPage from '~~/pages/projects/[id].vue'
import DefaultLayout from '~~/layouts/default.vue'
import { fakeUsers } from '~~/components/form/select/Users.stories'
import { SourceApps } from '@speckle/shared'
import { times } from 'lodash-es'

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
                team: fakeUsers.slice(3)
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
                  totalCount: 15,
                  cursor: null,
                  items: times(8).map((i) => ({
                    __typename: 'Model',
                    id: `${i}`,
                    name: `Model #${i}`,
                    versionCount: Math.ceil(Math.random() * 10),
                    commentThreadCount: Math.ceil(Math.random() * 10),
                    // TODO: Fix CORS on latest
                    previewUrl:
                      'https://latest.speckle.dev/preview/7d051a6449/commits/270741bd70',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                  }))
                }
              }
            } as ProjectLatestModelsQuery
          }
        }
      ]
    },
    vueRouter: {
      route: { params: { id: fakeProjectId } }
    }
  } as StorybookParameters
}
