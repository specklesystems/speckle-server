<template>
  <page-placeholder>
    <template #image>
      <!-- <v-img contain max-height="200" src="@/assets/lockbox.png" />
       -->
      <user-avatar
        :id="inviter.id"
        :name="inviter.name"
        :avatar="inviter.avatar"
        :size="150"
      />
    </template>
    <template #default>
      <strong>{{ inviter.name }}</strong>
      has invited you to become a collaborator on this stream
    </template>
    <template #actions>
      <template v-if="isLoggedIn">
        <v-btn color="success" block class="mb-2" @click="$emit('accept')">
          Accept
        </v-btn>
        <v-btn color="error" block @click="$emit('decline')">Decline</v-btn>
      </template>
      <template v-else>
        <v-btn block color="primary" @click="$emit('log-in')">Log in</v-btn>
      </template>
    </template>
  </page-placeholder>
</template>
<script lang="ts">
import { PropType } from 'vue'
import PagePlaceholder from '@/main/components/common/PagePlaceholder.vue'
import UserAvatar from '@/main/components/common/UserAvatar.vue'
import { StreamInviteQuery } from '@/graphql/generated/graphql'
import { Get } from 'type-fest'
import { vueWithMixins } from '@/helpers/typeHelpers'
import { IsLoggedInMixin } from '@/main/lib/core/mixins/isLoggedInMixin'

type StreamInviteType = NonNullable<Get<StreamInviteQuery, 'streamInvite'>>

export default vueWithMixins(IsLoggedInMixin).extend({
  // @vue/component
  name: 'StreamInvitePlaceholder',
  components: {
    PagePlaceholder,
    UserAvatar
  },
  props: {
    streamInvite: {
      type: Object as PropType<StreamInviteType>,
      required: true
    }
  },
  computed: {
    inviter(): NonNullable<Get<StreamInviteQuery, 'streamInvite.invitedBy'>> {
      return this.streamInvite.invitedBy
    }
  }
})
</script>
