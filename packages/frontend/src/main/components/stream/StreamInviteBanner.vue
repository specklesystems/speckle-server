<template>
  <v-alert v-if="!closed && streamInvite" rounded="lg" elevation="4" dense>
    <div class="d-flex flex-column flex-md-row">
      <div class="flex-grow-1 d-flex align-center">
        <user-avatar
          :id="inviter.id"
          :name="inviter.name"
          :avatar="inviter.avatar"
          :size="25"
          class="mr-1"
        />
        <div>
          <strong>{{ inviter.name }}</strong>
          has invited you to become a collaborator on this stream
        </div>
      </div>
      <div class="d-flex mt-2 mt-md-0" style="min-width: 210px; text-align: right">
        <template v-if="isLoggedIn">
          <v-btn
            color="success"
            class="mr-2 flex-grow-1 flex-md-grow-0"
            @click="$emit('accept')"
          >
            Accept
          </v-btn>
          <v-btn
            color="error"
            class="flex-grow-1 flex-md-grow-0"
            @click="$emit('decline')"
          >
            Decline
          </v-btn>
        </template>
        <template v-else>
          <v-btn class="flex-grow-1" color="primary" @click="$emit('log-in')">
            Log in
          </v-btn>
        </template>
      </div>
    </div>
  </v-alert>
</template>
<script lang="ts">
import { StreamInviteQuery } from '@/graphql/generated/graphql'
import { vueWithMixins } from '@/helpers/typeHelpers'
import { PropType } from 'vue'
import UserAvatar from '@/main/components/common/UserAvatar.vue'
import type { Get } from 'type-fest'
import { IsLoggedInMixin } from '@/main/lib/core/mixins/isLoggedInMixin'

type StreamInviteType = NonNullable<Get<StreamInviteQuery, 'streamInvite'>>

export default vueWithMixins(IsLoggedInMixin).extend({
  // @vue/component
  name: 'StreamInviteBanner',
  components: {
    UserAvatar
  },
  props: {
    streamInvite: {
      type: Object as PropType<StreamInviteType>,
      required: true
    }
  },
  data: () => ({
    closed: false
  }),
  computed: {
    inviter(): NonNullable<Get<StreamInviteQuery, 'streamInvite.invitedBy'>> {
      return this.streamInvite.invitedBy
    }
  }
})
</script>
