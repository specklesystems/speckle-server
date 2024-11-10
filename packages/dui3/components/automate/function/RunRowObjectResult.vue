<template>
  <div :class="`overflow-hidden`">
    <button
      :class="`block transition text-left hover:bg-primary-muted hover:shadow-md rounded-md p-1 cursor-pointer border-l-2 border-primary bg-primary-muted shadow-md`"
      @click="handleClick()"
    >
      <div class="flex items-center space-x-1">
        <div>
          <Component :is="iconAndColor.icon" :class="`w-4 h-4 ${iconAndColor.color}`" />
        </div>
        <div :class="`text-xs ${iconAndColor.color}`">
          {{ result.category }}: {{ result.objectIds.length }} affected elements
        </div>
      </div>
      <div v-if="result.message" class="text-xs text-foreground-2 pl-5">
        {{ result.message }}
      </div>
    </button>
  </div>
</template>
<script setup lang="ts">
import { useQuery } from '@vue/apollo-composable'
import {
  XMarkIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'
import type { Automate } from '@speckle/shared'
import { objectQuery } from '~/lib/graphql/mutationsAndQueries'
import type { IModelCard } from '~/lib/models/card'
import { useAccountStore } from '~/store/accounts'

type ObjectResult = Automate.AutomateTypes.ResultsSchema['values']['objectResults'][0]

const props = defineProps<{
  modelCard: IModelCard
  result: ObjectResult
  functionId?: string
}>()

const accStore = useAccountStore()
const app = useNuxtApp()
const projectAccount = computed(() =>
  accStore.accountWithFallback(props.modelCard.accountId, props.modelCard.serverUrl)
)
const clientId = projectAccount.value.accountInfo.id

const applicationIds = ref<string[]>([])

const { result: objectResult } = useQuery(
  objectQuery,
  () => ({
    projectId: props.modelCard.projectId,
    objectId: props.result.objectIds[0] // TODO for each!!!
  }),
  () => ({ clientId })
)

type Data = {
  applicationId?: string
}

watch(objectResult, (newValue) => {
  const data = newValue?.project.object?.data as Data | undefined
  if (!applicationIds.value.includes(data?.applicationId as string)) {
    applicationIds.value.push(data?.applicationId as string)
  }
})

const handleClick = async () => {
  await app.$baseBinding.highlightObjects(applicationIds.value)
}

const iconAndColor = computed(() => {
  switch (props.result.level) {
    case 'ERROR':
      return {
        icon: XMarkIcon,
        color: 'text-danger font-medium'
      }
    case 'WARNING':
      return {
        icon: ExclamationTriangleIcon,
        color: 'text-warning font-medium'
      }
    case 'INFO':
    default:
      return {
        icon: InformationCircleIcon,
        color: 'text-foreground font-medium'
      }
  }
})
</script>
