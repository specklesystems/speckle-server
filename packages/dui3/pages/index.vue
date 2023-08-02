<template>
  <div>
    <div class="space-x-2 mb-6">
      <FormButton text size="sm" to="/onboarding/v1">Onboarding v1</FormButton>
      <FormButton text size="sm" to="/test">Tests Page</FormButton>
      <!-- <FormButton text size="sm" @click="createTestSenderCard()">
        Create Test Sender Card
      </FormButton> -->
    </div>
    <div class="mt-2 space-y-4">
      <div v-for="project in projectModelGroups" :key="project.projectId" class="">
        <CommonProjectModelGroup :project="project" />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useDocumentStateStore } from '~~/store/documentState'
// import { ISenderModelCard } from 'lib/bindings/definitions/IBasicConnectorBinding'
// import { nanoid } from 'nanoid'
// import { useAccountStore } from '~~/store/accounts'
// import { useSendFilterStore } from '~~/store/sendFilter'

// const { defaultAccount } = storeToRefs(useAccountStore())

// const { sendFilters, selectionFilter } = storeToRefs(useSendFilterStore())

const store = useDocumentStateStore()

const { projectModelGroups } = storeToRefs(store)

// const { $baseBinding } = useNuxtApp()

// const createTestSenderCard = async () => {
//   const projectId = '5c5fb3b216'
//   const modelId = nanoid()

//   const myFilter = {
//     ...selectionFilter.value,
//     name: 'Selection',
//     selectedObjectIds: ['a,b,', 'v']
//   }

//   const card = {
//     typeDiscriminator: 'SenderModelCard',
//     id: nanoid(),
//     modelId,
//     projectId,
//     accountId: defaultAccount.value.accountInfo.id,
//     sendFilter: myFilter
//   } as unknown as ISenderModelCard

//   await $baseBinding.addModelToDocumentState(card)
// }
</script>
