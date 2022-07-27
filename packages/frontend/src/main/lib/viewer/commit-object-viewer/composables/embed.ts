import { useRoute } from '@/main/lib/core/composables/router'
import { computed } from 'vue'

/**
 * Get embed viewer query params
 */
export function useEmbedViewerQuery() {
  const route = useRoute()
  const streamId = computed(() => (route.query.stream as string) || null)
  const branchName = computed(() => (route.query.branch as string) || null)
  const commitId = computed(() => (route.query.commit as string) || null)
  const objectId = computed(() => (route.query.object as string) || null)
  const transparent = computed(() => route.query.transparent === 'true')

  return { streamId, branchName, commitId, objectId, transparent }
}
