<template>
  <div>
    <CommonLoadingBar v-show="loading" :loading="loading" />
    <div class="space-y-1">
      <div v-for="kvp in limitedKvps" :key="kvp.key">
        <ViewerDataviewerRow :prop="kvp" />
      </div>
      <div v-if="limit < kvps.length">
        <FormButton text full-width size="xs" @click="limit += 20">
          show more
        </FormButton>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { CommonLoadingBar } from '@speckle/ui-components'
import { useLazyQuery } from '@vue/apollo-composable'
import { useInjectedViewerState } from '~/lib/viewer/composables/setup'
import { viewerRawObjectQuery } from '~/lib/viewer/graphql/queries'

const { projectId } = useInjectedViewerState()

const props = defineProps<{
  object: Record<string, unknown>
}>()

const { result, loading, load } = useLazyQuery(viewerRawObjectQuery, () => ({
  projectId: projectId.value,
  objectId: props.object['referencedId'] as string
}))

if (props.object['referencedId']) {
  load()
}

const kvps = computed(() => {
  const obj = (result.value?.project?.object?.data || props.object) as Record<
    string,
    unknown
  >
  const keys = Object.keys(obj)
  const localKvps = []
  for (const key of keys) {
    // if (!obj[key]) continue // TODO: deal with null/undef
    const value = obj[key] || obj[key] === 0 ? obj[key] : 'null'
    localKvps.push({
      key,
      value,
      type: Array.isArray(value) ? 'array' : typeof value
    })
  }
  return localKvps
})

const limit = ref(20)
const limitedKvps = computed(() => {
  return kvps.value.slice(0, limit.value)
})
</script>
