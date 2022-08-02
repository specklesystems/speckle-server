<template>
  <v-alert v-if="hasInvite" rounded="lg" elevation="4" dense>
    <div class="d-flex flex-column flex-md-row">
      <div class="flex-grow-1 d-flex align-center">
        <user-avatar
          :id="streamInviter.id"
          :name="streamInviter.name"
          :avatar="streamInviter.avatar"
          :size="25"
          class="mr-1"
        />
        <div>
          <strong>{{ streamInviter.name }}</strong>
          has invited you to become a collaborator on
          <template v-if="showStreamName">
            the stream
            <router-link :to="linkToStream">{{ streamName }}</router-link>
          </template>
          <template v-else>this stream</template>
        </div>
      </div>
      <div class="d-flex mt-2 mt-md-0" style="min-width: 210px; text-align: right">
        <template v-if="isLoggedIn">
          <v-btn
            color="primary"
            class="mr-2 flex-grow-1 flex-md-grow-0"
            @click="acceptInvite"
          >
            Accept
          </v-btn>
          <v-btn
            color="error"
            text
            outlined
            class="flex-grow-1 flex-md-grow-0"
            @click="declineInvite"
          >
            Decline
          </v-btn>
        </template>
        <template v-else>
          <v-btn
            class="flex-grow-1"
            color="primary"
            @click="rememberInviteAndRedirectToLogin"
          >
            Sign in
          </v-btn>
        </template>
      </div>
    </div>
  </v-alert>
</template>
<script lang="ts">
import { vueWithMixins } from '@/helpers/typeHelpers'
import UserAvatar from '@/main/components/common/UserAvatar.vue'
import { UsersStreamInviteMixin } from '@/main/lib/stream/mixins/streamInviteMixin'

export default vueWithMixins(UsersStreamInviteMixin).extend({
  // @vue/component
  name: 'StreamInviteBanner',
  components: {
    UserAvatar
  },
  props: {
    showStreamName: {
      type: Boolean,
      default: false
    }
  }
})
</script>
