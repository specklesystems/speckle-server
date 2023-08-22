<template>
  <v-select
    v-model="finalRole"
    :items="roles"
    dense
    filled
    rounded
    hide-details
    :label="label"
  ></v-select>
</template>
<script setup lang="ts">
import { ServerRoles, RoleInfo, Roles } from '@speckle/shared'
import { computed } from 'vue'

const emit = defineEmits<{
  (e: 'update:role', val: ServerRoles): void
}>()

const props = withDefaults(
  defineProps<{
    role: ServerRoles
    allowGuest?: boolean
    allowAdmin?: boolean
    label?: string
    forInvite?: boolean
  }>(),
  {
    allowAdmin: true
  }
)

const roles = computed(() =>
  Object.values(Roles.Server)
    .filter((r) => {
      if (r === Roles.Server.Admin) return props.allowAdmin
      if (r === Roles.Server.ArchivedUser) return !props.forInvite
      return true
    })
    .map((r) => ({
      text: RoleInfo.Server[r],
      value: r,
      disabled: r === Roles.Server.Guest && !props.allowGuest
    }))
)

const finalRole = computed({
  get: () => props.role,
  set: (newVal) => {
    emit('update:role', newVal)
  }
})
</script>
