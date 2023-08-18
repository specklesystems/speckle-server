<template>
  <v-row class="align-center px-3">
    <v-col cols="3" class="text-truncate">
      <user-avatar :id="selfUser.id" :size="30" class="mr-2"></user-avatar>

      <router-link
        class="text-decoration-none space-grotesk mx-1"
        :to="`/profile/${selfUser.id}`"
      >
        {{ selfUser.name }}
      </router-link>
    </v-col>
    <v-col cols="3" class="caption text-truncate">
      <v-icon
        v-if="selfUser.verified"
        v-tooltip="'Verfied email'"
        small
        class="mr-2 primary--text"
      >
        mdi-shield-check
      </v-icon>
      <v-icon v-else v-tooltip="'Email not verified'" small class="mr-2 warning--text">
        mdi-shield-alert
      </v-icon>
      {{ selfUser.email }}
    </v-col>
    <v-col
      v-tooltip="selfUser.company ? selfUser.company : 'No company info.'"
      cols="3"
      class="caption text-truncate"
    >
      <v-icon x-small>mdi-domain</v-icon>
      {{ selfUser.company ? selfUser.company : 'No company info.' }}
    </v-col>
    <v-col cols="3" class="d-flex align-center text-right">
      <v-icon small class="mr-2">
        {{
          selfUser.role === serverRoles.Admin
            ? 'mdi-key'
            : selfUser.role === serverRoles.ArchivedUser
            ? 'mdi-account-off'
            : 'mdi-account'
        }}
      </v-icon>
      <user-role-select
        :allow-guest="allowGuest"
        :role="selfUser.role"
        @update:role="(e) => $emit('change-role', { user, role: e })"
      />
      <v-btn
        v-tooltip="'Delete user'"
        small
        icon
        color="error"
        @click="$emit('delete', selfUser)"
      >
        <v-icon small>mdi-delete-outline</v-icon>
      </v-btn>
    </v-col>
  </v-row>
</template>
<script>
import UserRoleSelect from '@/main/components/common/UserRoleSelect.vue'
import { Roles } from '@speckle/shared'

export default {
  name: 'UsersListUserItem',
  components: {
    UserAvatar: () => import('@/main/components/common/UserAvatar'),
    UserRoleSelect
  },
  props: {
    user: { type: Object, default: () => null },
    allowGuest: { type: Boolean }
  },
  data() {
    return {
      selfUser: this.user,
      serverRoles: Roles.Server
    }
  }
}
</script>
