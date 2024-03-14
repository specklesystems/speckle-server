import { MainServerInfoDocument } from '@/graphql/generated/graphql'
import { useQuery } from '@vue/apollo-composable'
import { computed } from 'vue'

export function useServerInfo() {
  const { result } = useQuery(MainServerInfoDocument)

  const serverInfo = computed(() => result.value?.serverInfo)
  const isGuestMode = computed(() => !!serverInfo.value?.guestModeEnabled)

  return { serverInfo, isGuestMode }
}

export function useFE2Messaging() {
  const { serverInfo } = useServerInfo()
  const fe2MessagingEnabled = computed(
    () => serverInfo.value?.enableNewWebUiMessaging || false
  )
  const migrationMovedTo = computed(
    () => serverInfo.value?.migration?.movedTo || 'https://app.speckle.systems'
  )
  return { fe2MessagingEnabled, migrationMovedTo }
}
