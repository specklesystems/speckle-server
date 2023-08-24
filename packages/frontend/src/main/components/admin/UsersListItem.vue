<template>
  <users-list-user-item
    v-if="registeredUser"
    :user="registeredUser"
    :allow-guest="allowGuest"
    @change-role="$emit('user-change-role', $event)"
    @delete="$emit('user-delete', $event)"
  />
  <users-list-invite-item
    v-else
    :invite="invitedUser"
    @delete="$emit('invite-delete', $event)"
    @resend="$emit('invite-resend', $event)"
  />
</template>
<script lang="ts">
import { AdminUsersListItem, ServerInvite, User } from '@/graphql/generated/graphql'
import Vue, { PropType } from 'vue'
import { MaybeFalsy } from '@/helpers/typeHelpers'
import UsersListUserItem from '@/main/components/admin/UsersListUserItem.vue'
import UsersListInviteItem from '@/main/components/admin/UsersListInviteItem.vue'

export default Vue.extend({
  name: 'UsersListItem',
  components: {
    UsersListUserItem,
    UsersListInviteItem
  },
  props: {
    item: {
      type: Object as PropType<AdminUsersListItem>,
      required: true,
      validator(val: AdminUsersListItem): boolean {
        return !!(val.invitedUser || val.registeredUser)
      }
    },
    allowGuest: { type: Boolean }
  },
  computed: {
    registeredUser(): MaybeFalsy<User> {
      return this.item.registeredUser
    },
    invitedUser(): MaybeFalsy<ServerInvite> {
      return this.item.invitedUser
    }
  }
})
</script>
