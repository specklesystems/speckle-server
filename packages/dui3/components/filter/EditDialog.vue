<template>
  <div class="space-y-4">
    <div class="h5 font-semibold">Edit Filter</div>
    <div class="">
      <FormSelectBase
        v-model="selectedSendFilterName"
        name="sendFilter"
        label="Project roles"
        class="w-full"
        :items="sendFilterNames"
        :allow-unset="false"
      >
        <template #something-selected="{ value }">
          <span class="text-primary">{{ value }}</span>
        </template>
        <template #option="{ item }">
          {{ item }}
        </template>
      </FormSelectBase>
    </div>
    <div v-if="activeFilter.name === 'Selection'">
      <FilterSelection :filter="(activeFilter as IDirectSelectionSendFilter)" />
    </div>
    <div v-else-if="activeFilter.name === 'Everything'">
      <div class="p-4 text-center text-primary">
        All supported objects will be sent.
      </div>
      <div class="flex justify-end">
        <FormButton text>Save</FormButton>
        <FormButton>Save & Send</FormButton>
      </div>
    </div>
    <div v-else>{{ activeFilter }}</div>
    <!-- <div><FormButton>Save</FormButton></div> -->
  </div>
</template>
<script setup lang="ts">
import { ChevronRightIcon } from '@heroicons/vue/20/solid'
import {
  ISenderModelCard,
  ISendFilter,
  IDirectSelectionSendFilter
} from '~~/lib/bindings/definitions/IBasicConnectorBinding'
import { useSendFilterStore } from '~~/store/sendFilter'

const sendFilterStore = useSendFilterStore()
const { sendFilters } = storeToRefs(sendFilterStore)

const props = defineProps<{
  model: ISenderModelCard
}>()

const sendFilterNames = computed(() => sendFilters.value?.map((f) => f.name))

const newFilter = ref<ISendFilter>()
const activeFilter = computed(() => newFilter.value || props.model.sendFilter)

const selectedSendFilterName = ref(activeFilter.value.name)

watch(selectedSendFilterName, (newVal, oldVal) => {
  if (newVal === oldVal) return

  if (newVal === initialSelectionFilterBackup.name) {
    newFilter.value = undefined
    return
  }

  const filter = sendFilters.value?.find((f) => f.name === newVal)
  newFilter.value = filter
})

const initialSelectionFilterBackup = { ...props.model.sendFilter } // TODO: unsure it's needed
</script>
