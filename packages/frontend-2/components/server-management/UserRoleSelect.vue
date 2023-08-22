<template>
  <FormSelectBase
    v-model="selectedValue"
    :items="roles"
    label="Role"
    name="userRole"
    :allow-unset="false"
    class="py-1"
    :disabled="disabled"
  >
    <template #something-selected="{ value }">
      <span class="truncate">{{ getRoleLabel(value) }}</span>
    </template>

    <template #option="{ item }">
      <span class="truncate">{{ getRoleLabel(item) }}</span>
    </template>
  </FormSelectBase>
</template>

<script setup lang="ts">
import { Roles, ServerRoles } from '@speckle/shared/src/core/constants'
import { useFormSelectChildInternals } from '~~/lib/form/composables/select'
import { roleLookupTable, getRoleLabel } from '~~/lib/server-management/helpers/utils'

type ValueType = ServerRoles | ServerRoles[] | undefined

const props = defineProps({
  modelValue: {
    type: [String, Array] as PropType<ValueType>,
    default: () => null
  },
  multiple: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits<{
  (e: 'update:modelValue', v: ValueType): void
}>()

const { selectedValue } = useFormSelectChildInternals<ServerRoles>({
  props: toRefs(props),
  emit
})

const roles = Object.values(Roles.Server).filter(
  (role) => role in roleLookupTable && role !== Roles.Server.Guest
)
</script>
