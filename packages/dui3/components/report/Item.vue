<template>
  <button
    v-tippy="
      reportItem.status === 1
        ? `${reportItem.sourceType} > ${reportItem.resultType}`
        : reportItem.error?.stackTrace
    "
    class="block rounded-lg p-1 transition hover:bg-primary-muted"
    @click="highlightObject"
  >
    <div class="text-foreground-2 flex items-center relative">
      <div class="mr-1 hover:cursor-pointer" :onclick="toggleDetails">
        <div v-if="reportItem.status === 1">
          <CheckCircleIcon class="w-4 stroke-green-500 text-green-500" />
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
    </div>
  </button>
</template>

<script setup lang="ts">
import { ExclamationCircleIcon, CheckCircleIcon } from '@heroicons/vue/24/solid'
import { ConversionResult } from '~/lib/conversions/conversionResult'
import { useAccountStore } from '~/store/accounts'
import { IModelCard } from 'lib/models/card'

const app = useNuxtApp()
const accStore = useAccountStore()

const showDetails = ref<boolean>(false)

const props = defineProps<{
  reportItem: ConversionResult
}>()

const cardBase = inject('cardBase') as IModelCard

const acc = accStore.accounts.find((acc) => acc.accountInfo.id === cardBase.accountId)

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

  // lastly, open in browser for failed receive reports
  // This is a POC implementation. Later we will highlight object(s) within the model. Currently it is done by 'Isolate' filter on viewer but there is no direct URL to achieve this.
  const url = `${acc?.accountInfo.serverInfo.url}/projects/${cardBase?.projectId}/models/${props.reportItem.sourceId}`
  app.$openUrl(url)
}

const toggleDetails = () => {
  showDetails.value = !showDetails.value
}
</script>
