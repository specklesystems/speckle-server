<template>
  <button
    class="block rounded-lg p-1 transition hover:bg-primary-muted"
    @click="highlightObject"
  >
    <div class="text-foreground-2 flex items-center relative">
      <div class="mr-1 hover:cursor-pointer">
        <div v-if="reportItem.status === 1">
          <CheckCircleIcon class="w-4 stroke-green-500 text-green-500" />
        </div>
        <div v-else-if="reportItem.status === 3">
          <ExclamationTriangleIcon class="w-4 text-warning"></ExclamationTriangleIcon>
        </div>
        <div v-else>
          <ExclamationCircleIcon class="w-4 text-danger"></ExclamationCircleIcon>
        </div>
      </div>
      <div class="text-xs transition truncate">
        <span v-if="reportItem.status === 1">
          {{ reportItem.sourceType?.split('.').reverse()[0] }} >
        </span>

        <span>
          {{
            reportItem.resultType
              ? reportItem.resultType?.split('.').reverse()[0]
              : reportItem.error?.message
          }}
        </span>
      </div>
      <button
        v-tippy="'Details'"
        class="block rounded-lg transition hover:bg-primary-muted ml-auto"
        @click.stop="toggleDetails"
      >
        <div v-if="!showDetails">
          <ChevronDownIcon class="w-4" />
        </div>
        <div v-else>
          <ChevronUpIcon class="w-4" />
        </div>
      </button>
      <button
        v-if="reportItem.status !== 1 && !isSender"
        v-tippy="'See object on Web'"
        class="block rounded-lg transition hover:bg-primary-muted ml-1"
        @click.stop="openObjectOnWeb"
      >
        <ArrowTopRightOnSquareIcon class="w-4" />
      </button>
    </div>
  </button>
  <div
    v-if="showDetails"
    class="text-xs text-foreground-2 ml-3 rounded-lg p-1 hover:bg-primary-muted hover:cursor-pointer"
  >
    <button
      v-tippy="'Copy to clipboard'"
      class="text-left w-full whitespace-pre-wrap break-all overflow-hidden"
      @click="copyToClipboard(details)"
    >
      {{ details }}
    </button>
  </div>
</template>

<script setup lang="ts">
import {
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/vue/24/solid'
import type { ConversionResult } from '~/lib/conversions/conversionResult'
import { useAccountStore } from '~/store/accounts'
import type { IModelCard } from '~/lib/models/card'
import { useHostAppStore } from '~/store/hostApp'

const app = useNuxtApp()
const hostAppStore = useHostAppStore()
const accStore = useAccountStore()

const showDetails = ref<boolean>(false)

const props = defineProps<{
  reportItem: ConversionResult
}>()

const cardBase = inject('cardBase') as IModelCard

const isSender = computed(() =>
  hostAppStore.models
    .find((m) => m.modelCardId === cardBase.modelCardId)
    ?.typeDiscriminator.toLowerCase()
    .includes('sender')
)

const acc = accStore.accounts.find((acc) => acc.accountInfo.id === cardBase.accountId)

const details = computed(() =>
  props.reportItem.error
    ? props.reportItem.error.stackTrace
    : `${props.reportItem.sourceType} > ${props.reportItem.resultType}`
)

const openObjectOnWeb = () => {
  // This is a POC implementation. Later we will highlight object(s) within the model. Currently it is done by 'Isolate' filter on viewer but there is no direct URL to achieve this.
  const url = `${acc?.accountInfo.serverInfo.url}/projects/${cardBase?.projectId}/models/${props.reportItem.sourceId}`
  app.$openUrl(url)
}

const highlightObject = () => {
  // sender reports highlight in source app
  if (cardBase.typeDiscriminator.toLowerCase().includes('send')) {
    app.$baseBinding.highlightObjects([props.reportItem.sourceId])
    return
  }

  // receive reports that are ok highliht in source app
  if (props.reportItem.status === 1 && props.reportItem.resultId) {
    app.$baseBinding.highlightObjects([props.reportItem.resultId])
    return
  }
}

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text)
}

const toggleDetails = () => {
  showDetails.value = !showDetails.value
}
</script>
