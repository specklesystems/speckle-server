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
            @click="accept"
          >
            Accept
          </v-btn>
          <v-btn color="error flex-grow-1 flex-md-grow-0" @click="decline">
            Decline
          </v-btn>
        </template>
        <template v-else>
          <v-btn class="flex-grow-1" color="primary" @click="logIn">Log in</v-btn>
        </template>
      </div>
    </div>
  </v-alert>
</template>
<script lang="ts">
import { StreamInviteQuery, useStreamInviteMutation } from '@/graphql/generated/graphql'
import { vueWithMixins } from '@/helpers/typeHelpers'
import { PropType } from 'vue'
import UserAvatar from '@/main/components/common/UserAvatar.vue'
import type { Get } from 'type-fest'
import { StreamEvents } from '@/main/lib/core/helpers/eventHubHelper'
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
    },
    streamId(): string {
      return this.streamInvite.streamId
    }
  },
  methods: {
    accept() {
      return this.processInvite(true)
    },
    decline() {
      return this.processInvite(false)
    },
    logIn() {
      if (this.isLoggedIn) return
      this.$loginAndSetRedirect()
    },
    async processInvite(accept: boolean) {
      if (!this.streamInvite?.inviteId) return

      const { data, errors } = await useStreamInviteMutation(this, {
        variables: {
          accept,
          streamId: this.streamId,
          inviteId: this.streamInvite.inviteId
        }
      })

      if (data?.streamInviteUse) {
        this.$triggerNotification({
          text: accept
            ? "You've been successfully added as a stream contributor!"
            : "You've declined the invite",
          type: accept ? 'success' : 'primary'
        })

        // Refetch stream, if accepted
        if (accept) {
          this.$eventHub.$emit(StreamEvents.Refetch)
        }

        this.closed = true
      } else {
        const errMsg = errors?.[0].message || 'An unexpected issue occurred!'
        this.$triggerNotification({
          text: errMsg,
          type: 'error'
        })
      }
    }
  }
})
</script>
