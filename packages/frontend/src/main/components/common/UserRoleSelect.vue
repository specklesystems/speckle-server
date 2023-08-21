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

const props = defineProps<{
  role: ServerRoles
  allowGuest?: boolean
  label?: string
  forInvite?: boolean
}>()

const roles = computed(() =>
  Object.values(Roles.Server)
    .filter((r) => !props.forInvite || r !== Roles.Server.ArchivedUser)
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
