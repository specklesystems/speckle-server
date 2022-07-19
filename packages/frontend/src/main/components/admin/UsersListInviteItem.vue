<template>
  <v-row class="d-flex align-center px-3">
    <v-col cols="6" class="text-truncate">
      <v-icon color="primary" class="px-2 mr-3">mdi-email</v-icon>
      <span v-tooltip="invite.email">{{ invite.email }}</span>
    </v-col>
    <v-col cols="3" class="text-truncate caption">
      <span class="grey--text">invited by</span>
      <user-avatar :id="invite.invitedBy.id" :size="20" class="mx-2" />
      <span>{{ invite.invitedBy.name }}</span>
    </v-col>
    <v-col cols="3" class="d-flex align-center">
      <v-btn class="flex-grow-1 mr-2" @click="$emit('resend', { inviteId: invite.id })">
        Resend Invite
      </v-btn>
      <v-btn
        v-tooltip="'Delete invite'"
        small
        icon
        color="error"
        @click="$emit('delete', { inviteId: invite.id })"
      >
        <v-icon small>mdi-delete-outline</v-icon>
      </v-btn>
    </v-col>
  </v-row>
</template>
<script lang="ts">
import { ServerInvite } from '@/graphql/generated/graphql'
import Vue, { PropType } from 'vue'
import UserAvatar from '@/main/components/common/UserAvatar.vue'

export default Vue.extend({
  name: 'UsersListInviteItem',
  components: {
    UserAvatar
  },
  props: {
    invite: {
      type: Object as PropType<ServerInvite>,
      required: true
    }
  }
})
</script>
