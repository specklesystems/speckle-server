import { gql } from '@apollo/client/core'
import type { AccTokens } from '@speckle/shared/acc'
import { useApolloClient, useQuery } from '@vue/apollo-composable'
import { accFolderDataQuery } from '~/lib/acc/graphql/queries'
import type { AccIntegrationFolderNode_AccFolderFragment } from '~/lib/common/generated/gql/graphql'
import { useActiveWorkspaceSlug } from '~/lib/user/composables/activeWorkspace'

export const useAccFolder = (
  accProjectId: string,
  accFolderId: MaybeRef<string | undefined>,
  accTokens?: AccTokens
) => {
  const workspaceSlug = useActiveWorkspaceSlug()

  const apollo = useApolloClient()

  const cachedFolder = computed(() => {
    return apollo.client.cache.readFragment<AccIntegrationFolderNode_AccFolderFragment>(
      {
        id: `AccFolder:${unref(accFolderId)}`,
        fragment: gql`
          fragment AccFolderContents on AccFolder {
            id
            name
            contents {
              items {
                id
                name
                latestVersion {
                  id
                  name
                  versionNumber
                  fileType
                }
              }
            }
            children {
              items {
                id
                name
              }
            }
          }
        `
      }
    )
  })

  // watch(cachedFolder, (v) => {
  //   console.log({ cachedFolder: v })
  // }, {
  //   immediate: true
  // })

  const { result: folder } = useQuery(
    accFolderDataQuery,
    () => ({
      workspaceSlug: workspaceSlug.value!,
      accToken: accTokens!.access_token,
      accProjectId,
      accFolderId: unref(accFolderId)!
    }),
    () => ({
      enabled: !!unref(accFolderId) && !!accTokens && !!workspaceSlug.value
    })
  )

  // watch(folder, (v) => {
  //   console.log({ queryFolder: v })
  // }, {
  //   immediate: true
  // })

  const folderData = computed(() => ({
    id: accFolderId,
    ...cachedFolder.value,
    ...folder.value?.workspaceBySlug.integrations?.acc?.folder
  }))

  return folderData
}
