<template>
  <div class="presentation-state-setup">
    <slot />
  </div>
</template>
<script setup lang="ts">
import { writableAsyncComputed } from '~/lib/common/composables/async'
import {
  useSetupPresentationState,
  type InjectablePresentationState,
  type UseSetupPresentationParams
} from '~/lib/presentations/composables/setup'

const emit = defineEmits<{
  setup: [InjectablePresentationState]
}>()

const route = useRoute()
const router = useSafeRouter()
const projectId = writableAsyncComputed({
  get: () => route.params.id as string,
  set: async (value) => {
    await router.push(() => ({
      params: { id: value }
    }))
  },
  initialState: route.params.id as string,
  asyncRead: false
})

const presentationId = writableAsyncComputed({
  get: () => route.params.presentationId as string,
  set: async (value) => {
    await router.push(() => ({
      params: { presentationId: value }
    }))
  },
  initialState: route.params.presentationId as string,
  asyncRead: false
})

const initParams = computed(
  (): UseSetupPresentationParams => ({
    projectId,
    presentationId
  })
)

const state = useSetupPresentationState(initParams.value)
emit('setup', state)
</script>
