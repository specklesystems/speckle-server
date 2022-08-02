<template>
  <div class="user-stream-invite-banners d-flex flex-column">
    <stream-invite-banner
      v-for="invite in streamInvites"
      :key="invite.id"
      :stream-invite="invite"
      :show-stream-name="true"
      @invite-used="onInviteUsed($event, invite)"
    />
  </div>
</template>
<script lang="ts">
import Vue from 'vue'
import StreamInviteBanner from '@/main/components/stream/StreamInviteBanner.vue'
import { UserStreamInvitesDocument } from '@/graphql/generated/graphql'
import { StreamInviteType } from '@/main/lib/stream/mixins/streamInviteMixin'

export default Vue.extend({
  name: 'UserStreamInviteBanners',
  components: {
    StreamInviteBanner
  },
  data: () => ({
    streamInvites: [] as NonNullable<StreamInviteType[]>
  }),
  apollo: {
    streamInvites: {
      query: UserStreamInvitesDocument
    }
  },
  methods: {
    onInviteUsed({ accept }: { accept: boolean }, invite: StreamInviteType) {
      this.$emit('invite-used', { accept, invite })
    }
  }
})
</script>
