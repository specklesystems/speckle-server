import { ApolloClient } from '@apollo/client/core'
import {
  provideApolloClient,
  useMutation,
  useQuery,
  useSubscription
} from '@vue/apollo-composable'
import { onProjectVersionsUpdateSubscription } from '~/lib/graphql/subscriptions'
import {
  VersionCreateInput,
  ProjectCreateInput
} from '~~/lib/common/generated/gql/graphql'
import {
  createVersionMutation,
  createProjectMutation,
  createModelMutation,
  projectDetailsQuery,
  modelDetailsQuery,
  projectsListQuery,
  projectModelsQuery,
  modelVersionsQuery
} from '~~/lib/graphql/mutationsAndQueries'
import { useAccountStore } from '~~/store/accounts'

function getValidOrDefaultAccount(
  clientId: string | undefined = undefined
): ApolloClient<unknown> {
  const { defaultAccount, accounts } = storeToRefs(useAccountStore())
  if (!clientId) return defaultAccount.value?.client as ApolloClient<unknown>
  const account = accounts.value.find((acc) => acc.accountInfo.id === clientId)
  if (account) return account.client as ApolloClient<unknown>

  throw new Error(`Failed to find a valid account for id ${clientId}`)
}

export function useProjectVersionUpdated(clientId: string | undefined = undefined) {
  return (projectId: string) => {
    const client = getValidOrDefaultAccount(clientId)
    const onProjectVersionUpdate = provideApolloClient(client)(() =>
      useSubscription(onProjectVersionsUpdateSubscription, { id: projectId })
    )
    return onProjectVersionUpdate
  }
}

export function useCreateVersion(clientId: string | undefined = undefined) {
  return async (version: VersionCreateInput) => {
    const client = getValidOrDefaultAccount(clientId)
    const createVersion = provideApolloClient(client)(() =>
      useMutation(createVersionMutation)
    )
    // we can return here directly createVersion to reach some other props like `loading`, `error`.
    const res = await createVersion.mutate({ input: version })
    return res
  }
}

export function useCreateNewProject(clientId: string | undefined = undefined) {
  return async (input: ProjectCreateInput) => {
    const client = getValidOrDefaultAccount(clientId)
    const res = await client.mutate({
      mutation: createProjectMutation,
      variables: { input }
    })

    if (!res.data?.projectMutations.create.id) {
      console.error(res.errors)
    } else {
      console.log('created project!')
      // success!
    }

    return res
  }
}

export function useCreateNewModel(clientId: string | undefined = undefined) {
  return async (input: { name: string; projectId: string }) => {
    const client = getValidOrDefaultAccount(clientId)
    const res = await client.mutate({
      mutation: createModelMutation,
      variables: { input }
    })

    if (!res.data?.modelMutations.create.id) {
      console.error(res.errors)
    } else {
      console.log('created model!')
      // success!
    }

    return res
  }
}

export function useGetProjects(clientId: string | undefined = undefined) {
  return async (query: string | undefined) => {
    const client = getValidOrDefaultAccount(clientId)

    const res = await client.query({
      query: projectsListQuery,
      variables: { limit: 10, filter: { search: query } }
    })

    if (!res.data) {
      console.error(res.errors)
    } else {
      // success!
    }

    return res.data?.activeUser?.projects.items
  }
}

export function useGetProjectModels(clientId: string | undefined = undefined) {
  return async (projectId: string, query: string) => {
    const client = getValidOrDefaultAccount(clientId)
    const res = await client.query({
      query: projectModelsQuery,
      variables: { projectId, filter: { search: query } }
    })

    if (!res.data) {
      console.error(res.errors)
    } else {
      // success!
    }

    return res.data.project.models.items
  }
}

export function useGetModelVersions(clientId: string | undefined = undefined) {
  return async (projectId: string, modelId: string) => {
    const client = getValidOrDefaultAccount(clientId)
    const res = await client.query({
      query: modelVersionsQuery,
      variables: { projectId, modelId }
    })

    if (!res.data) {
      console.error(res.errors)
    } else {
      // success!
    }

    return res.data.project.model.versions.items
  }
}

export function useGetProjectDetails(clientId: string | undefined = undefined) {
  return async (input: { projectId: string }) => {
    const client = getValidOrDefaultAccount(clientId)
    const res = await client.query({
      query: projectDetailsQuery,
      variables: { projectId: input.projectId }
    })

    if (!res.data?.project.id) {
      console.error(res.errors)
    } else {
      // success!
    }

    return res.data.project
  }
}

export function useGetModelDetails(clientId: string | undefined = undefined) {
  return async (input: { projectId: string; modelId: string }) => {
    const client = getValidOrDefaultAccount(clientId)

    const res = await client.query({
      query: modelDetailsQuery,
      variables: { ...input }
    })

    if (!res.data?.project.id) {
      console.error(res.errors)
    } else {
      // success!
    }

    return res.data.project.model
  }
}
