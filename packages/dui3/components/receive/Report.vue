<template>
  <ReportConversion
    :reports="props.modelCard.receiveResult?.receiveConversionResults"
    @on-highlight="highlightObject"
  ></ReportConversion>
</template>

<script setup lang="ts">
import { IReceiverModelCard } from '~/lib/models/card/receiver'
import { useAccountStore } from '~/store/accounts'

const app = useNuxtApp()
const accStore = useAccountStore()

const props = defineProps<{
  modelCard: IReceiverModelCard
}>()

const acc = accStore.accounts.find(
  (acc) => acc.accountInfo.id === props.modelCard.accountId
)

const highlightObject = (
  targetId: string,
  resultId: string | undefined,
  isSuccessful: boolean
) => {
  if (isSuccessful && resultId) {
    app.$baseBinding.highlightObjects([resultId])
    return
  }
  // This is a POC implementation. Later we will highlight object(s) within the model. Currently it is done by 'Isolate' filter on viewer but there is no direct URL to achieve this.
  const url = `${acc?.accountInfo.serverInfo.url}/projects/${props.modelCard?.projectId}/models/${targetId}`
  app.$openUrl(url)
}
</script>
