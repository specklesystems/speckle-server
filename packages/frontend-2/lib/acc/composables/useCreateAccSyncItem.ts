import { useApolloClient } from '@vue/apollo-composable'
import { accSyncItemCreateMutation } from '~/lib/acc/graphql/mutations'
import { useCreateNewModel } from '~/lib/projects/composables/modelManagement'

export const useCreateAccSyncItem = () => {
  const apollo = useApolloClient().client
  const { triggerNotification } = useGlobalToast()
  const createModel = useCreateNewModel()

  return async (args: {
    projectId: string
    accRegion: string
    accFileExtension: string
    accHubId: string
    accProjectId: string
    accRootProjectFolderUrn: string
    accFileLineageUrn: string
    accFileName: string
    accFileVersionIndex: number
    accFileVersionUrn: string
    accFileViewName?: string
  }) => {
    try {
      const model = await createModel({
        name: args.accFileName,
        description: '',
        projectId: args.projectId
      })

      if (!model) {
        throw new Error('Failed to create model')
      }

      await apollo.mutate({
        mutation: accSyncItemCreateMutation,
        variables: {
          input: {
            projectId: args.projectId,
            modelId: model.id,
            accHubId: args.accHubId,
            accRegion: args.accRegion,
            accProjectId: args.accProjectId,
            accRootProjectFolderUrn: args.accRootProjectFolderUrn,
            accFileLineageUrn: args.accFileLineageUrn,
            accFileVersionUrn: args.accFileVersionUrn,
            accFileName: args.accFileName,
            accFileExtension: args.accFileExtension,
            accFileVersionIndex: args.accFileVersionIndex,
            accFileViewName: args.accFileViewName
          }
        },
        update: (cache, { data }) => {
          if (!data?.accSyncItemMutations.create) return
          const newSyncItem = data.accSyncItemMutations.create
          cache.modify({
            id: getCacheId('Model', model.id),
            fields: {
              accSyncItem: () => newSyncItem
            }
          })
          cache.modify({
            id: getCacheId('Project', args.projectId),
            fields: {
              accSyncItems: (value) => {
                const syncItems = value ?? []
                return [newSyncItem, ...syncItems]
              }
            }
          })
        }
      })
    } catch (e) {
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: 'Failed to sync with ACC',
        description: e instanceof Error ? e.message : 'Unexpected error'
      })
    }
  }
}
