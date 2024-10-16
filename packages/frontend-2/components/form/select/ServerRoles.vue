<template>
  <FormSelectBase
    v-model="selectedValue"
    :items="roles"
    :multiple="multiple"
    :disabled-item-predicate="disabledItemPredicate"
    :disabled-item-tooltip="
      !allowGuest ? 'The Guest role isn\'t enabled on the server' : ''
    "
    name="serverRoles"
    label="Role"
    :show-label="showLabel"
    class="min-w-[110px]"
    :fully-control-value="fullyControlValue"
    :label-id="labelId"
    :button-id="buttonId"
    :disabled="disabled"
    mount-menu-on-body
  >
    <template #nothing-selected>
      {{ multiple ? 'Select roles' : 'Select role' }}
    </template>
    <template #something-selected="{ value }">
      <template v-if="isMultiItemArrayValue(value)">
        <div ref="elementToWatchForChanges" class="flex items-center space-x-0.5">
          <div
            ref="itemContainer"
            class="flex flex-wrap overflow-hidden space-x-0.5 h-6"
          >
            <div v-for="(item, i) in value" :key="item" class="text-foreground">
              {{ RoleInfo.Server[item].title + (i < value.length - 1 ? ', ' : '') }}
            </div>
          </div>
          <div v-if="hiddenSelectedItemCount > 0" class="text-foreground-2 normal">
            +{{ hiddenSelectedItemCount }}
          </div>
        </div>
      </template>
      <template v-else>
        <div class="truncate text-foreground">
          {{ RoleInfo.Server[firstItem(value)].title }}
        </div>
      </template>
    </template>
    <template #option="{ item }">
      <div class="flex flex-col space-y-0.5">
        <span class="truncate font-medium">
          {{ RoleInfo.Server[firstItem(item)].title }}
        </span>
        <span class="text-body-2xs text-foreground-2">
          {{ RoleInfo.Server[firstItem(item)].description }}
        </span>
      </div>
    </template>
  </FormSelectBase>
</template>
<script setup lang="ts">
import { Roles, RoleInfo } from '@speckle/shared'
import type { Nullable, ServerRoles } from '@speckle/shared'
import { useFormSelectChildInternals } from '@speckle/ui-components'
import type { PropType } from 'vue'

type ValueType = ServerRoles | ServerRoles[] | undefined

const emit = defineEmits<{
  (e: 'update:modelValue', v: ValueType): void
}>()

const props = defineProps({
  multiple: Boolean,
  modelValue: {
    type: [String, Array] as PropType<ValueType>,
    default: undefined
  },
  allowGuest: Boolean,
  allowAdmin: Boolean,
  allowArchived: Boolean,
  fullyControlValue: Boolean,
  showLabel: Boolean,
  disabled: Boolean
})

const elementToWatchForChanges = ref(null as Nullable<HTMLElement>)
const itemContainer = ref(null as Nullable<HTMLElement>)
const labelId = useId()
const buttonId = useId()

const { selectedValue, isMultiItemArrayValue, hiddenSelectedItemCount, firstItem } =
  useFormSelectChildInternals<ServerRoles>({
    props: toRefs(props),
    emit,
    dynamicVisibility: { elementToWatchForChanges, itemContainer }
  })

const roles = computed(() =>
  Object.values(Roles.Server).filter((r) => {
    if (r === Roles.Server.Admin) return props.allowAdmin
    if (r === Roles.Server.ArchivedUser) return props.allowArchived
    return true
  })
)

const disabledItemPredicate = (item: ServerRoles) => {
  if (item === Roles.Server.Guest) return !props.allowGuest
  return false
}
</script>
