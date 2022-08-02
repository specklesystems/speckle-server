<template>
  <page-placeholder v-if="hasInvite">
    <template #image>
      <div class="d-flex align-center">
        <user-avatar
          :id="streamInviter.id"
          :name="streamInviter.name"
          :avatar="streamInviter.avatar"
          :size="75"
        />
        <template v-if="$userId()">
          <v-icon class="mx-4">mdi-plus</v-icon>
          <user-avatar :id="$userId()" :size="75" />
        </template>
      </div>
    </template>
    <template #default>
      <strong>{{ streamInviter.name }}</strong>
      has invited you to become a collaborator on this stream
    </template>
    <template #actions>
      <template v-if="isLoggedIn">
        <v-btn color="primary" block class="mb-2 rounded-xl" @click="acceptInvite">
          Accept
        </v-btn>
        <v-btn color="error" block outlined class="rounded-xl" @click="declineInvite">
          Decline
        </v-btn>
      </template>
      <template v-else>
        <v-btn
          block
          color="primary"
          class="rounded-xl"
          @click="rememberInviteAndRedirectToLogin"
        >
          Sign in
        </v-btn>
      </template>
    </template>
  </page-placeholder>
</template>
<script lang="ts">
import PagePlaceholder from '@/main/components/common/PagePlaceholder.vue'
import UserAvatar from '@/main/components/common/UserAvatar.vue'
import { vueWithMixins } from '@/helpers/typeHelpers'
import { UsersStreamInviteMixin } from '@/main/lib/stream/mixins/streamInviteMixin'

export default vueWithMixins(UsersStreamInviteMixin).extend({
  // @vue/component
  name: 'StreamInvitePlaceholder',
  components: {
    PagePlaceholder,
    UserAvatar
  }
})
</script>
