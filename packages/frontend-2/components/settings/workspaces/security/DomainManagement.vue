<template>
  <div>
    <ul v-if="domains.length > 0">
      <li
        v-for="domain in domains"
        :key="domain.id"
        class="border-x border-b first:border-t first:rounded-t-lg border-outline-2 last:rounded-b-lg p-6 py-4 flex items-center"
      >
        <p class="text-body-xs font-medium flex-1">@{{ domain.domain }}</p>
        <FormButton color="outline" size="sm" @click="$emit('remove', domain)">
          Delete
        </FormButton>
      </li>
    </ul>

    <p
      v-else
      class="text-body-xs text-center text-foreground-2 border border-outline-2 p-6 rounded-lg"
    >
      No verified domains yet
    </p>

    <div class="grid grid-cols-2 gap-x-6 mt-6">
      <div class="flex flex-col gap-y-1">
        <p class="text-body-xs font-medium text-foreground">{{ addDomainTitle }}</p>
        <p class="text-body-2xs text-foreground-2 leading-5">
          {{ addDomainDescription }}
        </p>
      </div>
      <div class="flex gap-x-3">
        <FormSelectBase
          v-model="selectedDomain"
          :items="availableDomains"
          :disabled-item-predicate="disabledItemPredicate"
          disabled-item-tooltip="This domain can't be used for verified workspace domains"
          :name="selectName"
          label="Verified domains"
          class="w-full"
        >
          <template #nothing-selected>Select domain</template>
          <template #something-selected="{ value }">@{{ value }}</template>
          <template #option="{ item }">
            <div class="flex items-center">@{{ item }}</div>
          </template>
        </FormSelectBase>
        <FormButton :disabled="!selectedDomain" @click="handleAdd">Add</FormButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ShallowRef } from 'vue'
import { blockedDomains } from '@speckle/shared'

type Domain = {
  id: string
  domain: string
}

defineProps<{
  domains: Domain[]
  availableDomains: string[]
  addDomainTitle: string
  addDomainDescription: string
  selectName: string
}>()

const emit = defineEmits<{
  (e: 'add', domain: string): void
  (e: 'remove', domain: Domain): void
}>()

const selectedDomain = ref<string>()
const blockedDomainItems: ShallowRef<string[]> = shallowRef(blockedDomains)

const disabledItemPredicate = (item: string) => {
  return blockedDomainItems.value.includes(item)
}

const handleAdd = () => {
  if (!selectedDomain.value) return
  emit('add', selectedDomain.value)
  selectedDomain.value = undefined
}
</script>
