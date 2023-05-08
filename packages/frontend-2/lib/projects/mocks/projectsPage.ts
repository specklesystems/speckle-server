import {
  apolloMockRequestWithDefaults,
  MockedApolloFetchResult
} from '~~/lib/fake-nuxt-env/utils/betterMockLink'
import {
  ProjectsDashboardQueryQuery,
  ProjectsDashboardQueryQueryVariables
} from '~~/lib/common/generated/gql/graphql'
import { isNumber, times } from 'lodash-es'
import { Get } from 'type-fest'
import { Roles } from '@speckle/shared'
import { fakeUsers } from '~~/components/form/select/Users.stories'
import { mockProjectLatestModelsQuery } from '~~/lib/projects/mocks/projectPage'

const randomDate = new Date('01-01-2022')

export const mockProjectsDashboardPageQuery = apolloMockRequestWithDefaults<
  ProjectsDashboardQueryQuery,
  ProjectsDashboardQueryQueryVariables,
  Partial<{ guestMode: boolean; projectCount: number }>
>({
  request: ({ operationName }) => operationName === 'ProjectsDashboardQuery',
  result: (_, values): MockedApolloFetchResult<ProjectsDashboardQueryQuery> => {
    const isGuestMode = !!values?.guestMode

    let projectCount = 5
    if (values && isNumber(values.projectCount)) projectCount = values.projectCount

    const activeUser: Get<
      MockedApolloFetchResult<ProjectsDashboardQueryQuery>,
      'data.activeUser'
    > = isGuestMode
      ? null
      : {
          __typename: 'User',
          id: 'random-logged-in-user',
          projects: {
            __typename: 'ProjectCollection',
            cursor: null,
            items: times(projectCount, (i) => {
              const isOwner = i % 2 === 0
              const isContributor = i % 3 === 0
              const role = isOwner
                ? Roles.Stream.Owner
                : isContributor
                ? Roles.Stream.Contributor
                : Roles.Stream.Reviewer
              const id = `project-${i}`

              const modelsData = mockProjectLatestModelsQuery({
                resultCount: i % 8
              }).result({
                variables: { projectId: id }
              }).data?.project?.models || {
                __typename: 'ModelCollection',
                items: [],
                totalCount: 0
              }

              const ret: Get<
                MockedApolloFetchResult<ProjectsDashboardQueryQuery>,
                'data.activeUser.projects.items[0]'
              > = {
                __typename: 'Project',
                id,
                name: `Project #${i}`,
                createdAt: randomDate.toISOString(),
                updatedAt: randomDate.toISOString(),
                team: fakeUsers.map((u) => ({
                  __typename: 'ProjectCollaborator',
                  user: u
                })),
                role,
                pendingImportedModels: [], // TODO
                models: modelsData
              }

              return ret
            }),
            totalCount: projectCount
          },
          projectInvites: [] // TODO
        }

    return {
      data: {
        __typename: 'Query',
        activeUser
      }
    }
  }
})
