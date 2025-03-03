<template>
  <FormSelectBase
    v-bind="props"
    v-model="selectedValue"
    :name="name || 'regions'"
    :allow-unset="false"
    mount-menu-on-body
  >
    <template #option="{ item }">
      <div class="flex flex-col items-start justify-center">
        <span>{{ item.name }}</span>
        <span class="text-foreground-2 break-normal">{{ item.description }}</span>
      </div>
    </template>
    <template #nothing-selected>
      <span class="min-w-64 block">
        {{ multiple ? 'Select default data regions' : 'Select default data region' }}
      </span>
    </template>
    <template #something-selected="{ value }">
      <span class="min-w-64 block">
        <template v-if="isArray(value)">
          {{ value.map((v) => v.name).join(', ') }}
        </template>
        <template v-else>
          {{ value.name }}
        </template>
      </span>
    </template>
  </FormSelectBase>
</template>
<script setup lang="ts">
import { isArray } from 'lodash-es'
import type { RuleExpression } from 'vee-validate'
import { graphql } from '~/lib/common/generated/gql'
import type { SettingsWorkspacesRegionsSelect_ServerRegionItemFragment } from '~/lib/common/generated/gql/graphql'
import { useFormSelectChildInternals } from '~/lib/form/composables/select'

graphql(`
  fragment SettingsWorkspacesRegionsSelect_ServerRegionItem on ServerRegionItem {
    id
    key
    name
    description
  }
`)

type ItemType = SettingsWorkspacesRegionsSelect_ServerRegionItemFragment
type ValueType = ItemType | ItemType[] | undefined

const emit = defineEmits<{
  (e: 'update:modelValue', v: ValueType): void
}>()

const props = withDefaults(
  defineProps<{
    modelValue?: ValueType
    label: string
    items: ItemType[]
    multiple?: boolean
    name?: string
    showOptional?: boolean
    showRequired?: boolean
    showLabel?: boolean
    labelId?: string
    buttonId?: string
    help?: string
    disabled?: boolean
    rules?: RuleExpression<ItemType | ItemType[] | undefined>
    labelPosition?: 'left' | 'top'
    size?: 'sm' | 'base' | 'lg' | 'xl'
  }>(),
  {
    labelPosition: 'left',
    size: 'base'
  }
)

const { selectedValue } = useFormSelectChildInternals<ItemType>({
  props: toRefs(props),
  emit
})
</script>
