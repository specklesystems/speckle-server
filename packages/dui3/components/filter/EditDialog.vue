<template>
  <div class="space-y-4">
    <div class="h5 font-semibold">Edit Filter</div>
    <div class="">
      <FormSelectBase
        v-model="selectedSendFilterName"
        name="sendFilter"
        label="Avaialble send filters"
        class="w-full"
        fixed-height
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
    <!-- Special case filters -->
    <!-- Selection -->
    <div v-if="activeFilter.name === 'Selection'">
      <FilterSelection
        :filter="(activeFilter as IDirectSelectionSendFilter)"
        @save="save"
        @save-and-send="save"
      />
    </div>
    <!-- Everything -->
    <div v-else-if="activeFilter.name === 'Everything'">
      <div class="p-4 text-center text-primary">
        All supported objects will be sent.
      </div>

      <div class="flex justify-end">
        <FormButton text @click="save(activeFilter)">Save</FormButton>
        <FormButton @click="save(activeFilter)">Save & Send</FormButton>
      </div>
    </div>
    <!-- Other filters -->
    <!-- NOTE: unsure yet how this will play out -->
    <!-- Theoretically, filters are just... forms. So we could treat them as such? -->
    <div v-else>{{ activeFilter }}</div>
  </div>
</template>
<script setup lang="ts">
import {
  ISenderModelCard,
  ISendFilter,
  IDirectSelectionSendFilter
} from 'lib/models/card/send'
import { useHostAppStore } from '~~/store/hostApp'

const props = defineProps<{
  model: ISenderModelCard
}>()
const emit = defineEmits(['close'])

const store = useHostAppStore()
const { sendFilters } = storeToRefs(store)

const sendFilterNames = computed(() => sendFilters.value?.map((f) => f.name))

const newFilter = ref<ISendFilter>()
const activeFilter = computed(() => newFilter.value || props.model.sendFilter)

const selectedSendFilterName = ref(activeFilter.value.name)

watch(selectedSendFilterName, (newVal, oldVal) => {
  if (newVal === oldVal) return

  if (newVal === initialSelectionFilterBackup.name) {
    newFilter.value = undefined // fallback to initial filter backup
    return
  }

  const filter = sendFilters.value?.find((f) => f.name === newVal)
  newFilter.value = filter
})

const save = async (newFilter: ISendFilter) => {
  await store.updateModelFilter(props.model.id, newFilter)
  emit('close')
}

const initialSelectionFilterBackup = { ...props.model.sendFilter } // TODO: unsure it's needed
</script>
