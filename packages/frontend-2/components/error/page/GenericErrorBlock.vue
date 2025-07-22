<!-- eslint-disable vue/no-v-html -->
<template>
  <div class="flex flex-col items-center space-y-4">
    <!-- <ErrorPageProjectInviteBanner /> -->
    <h1 v-if="!isGenericErrorPage" class="text-heading-2xl">
      Error {{ error.statusCode || 500 }}
    </h1>
    <div class="flex flex-col items-center space-y-2">
      <h2 :class="messageClasses">
        {{ error.message }}
      </h2>
      <ErrorReference @click="() => copyReference({ date: dayjs(errorDate) })" />
    </div>

    <div
      v-if="isDev && error.stack"
      class="max-w-xl text-body-xs text-foreground-2"
      v-html="error.stack"
    />
    <FormButton :to="homeRoute">Go home</FormButton>
  </div>
</template>
<script setup lang="ts">
import type { SimpleError } from '~/lib/core/helpers/observability'
import { homeRoute } from '~~/lib/common/helpers/route'
import { useGenerateErrorReference } from '~/lib/core/composables/error'
import dayjs from 'dayjs'

const SSR_DATE_STATE_KEY = 'ssr_error_page_generic_block_static_date'
const getDate = () => new Date().toISOString()

const props = defineProps<{
  error: SimpleError
  /**
   * We have an /error page for rendering various errors that we don't really know much about (like their
   * actual status code), e.g. for auth errors. This makes the renderer place less of an emphasis on the status code.
   */
  isGenericErrorPage?: boolean
}>()

const isDev = ref(import.meta.dev)
const messageClasses = computed(() => {
  const classParts = ['text-foreground-2 mx-4 break-words max-w-full']

  if (props.isGenericErrorPage) {
    classParts.push('text-heading-xl')
  } else {
    classParts.push('text-heading-lg')
  }

  return classParts.join(' ')
})

// storing in state to avoid hydration mismatch when date gets regenerated in CSR
const ssrErrorDate = useState(SSR_DATE_STATE_KEY, () => getDate())
const errorDate = ref(
  import.meta.client && ssrErrorDate.value ? ssrErrorDate.value : getDate()
)
const { copyReference } = useGenerateErrorReference()

onMounted(() => {
  // Immediately wipe the SSR date when page is loaded in CSR
  clearNuxtState(SSR_DATE_STATE_KEY)
})
</script>
