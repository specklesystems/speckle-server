<template>
  <div class="stream-pending-collaborator-row d-flex align-center">
    <user-avatar
      v-if="user"
      :id="user.id"
      :avatar="user.avatar"
      :name="user.name"
      :size="30"
      class="pr-1"
    />
    <div
      v-tooltip="pendingCollaborator.title"
      :class="[!user ? 'italics' : '', 'row-title']"
    >
      {{ pendingCollaborator.title }}
    </div>
    <div class="ml-1 text-right flex-grow-1">
      <v-btn
        x-small
        color="error"
        dark
        :disabled="disabled"
        @click="$emit('cancel-invite')"
      >
        Cancel Invite
      </v-btn>
    </div>
  </div>
</template>
<script lang="ts">
import { LimitedUser, PendingStreamCollaborator } from '@/graphql/generated/graphql'
import Vue, { PropType } from 'vue'
import UserAvatar from '@/main/components/common/UserAvatar.vue'
import { MaybeFalsy } from '@/helpers/typeHelpers'

export default Vue.extend({
  name: 'StreamPendingCollaboratorRow',
  components: {
    UserAvatar
  },
  props: {
    pendingCollaborator: {
      type: Object as PropType<PendingStreamCollaborator>,
      required: true
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    user(): MaybeFalsy<LimitedUser> {
      return this.pendingCollaborator.user
    }
  }
})
</script>
<style lang="scss" scoped>
.stream-pending-collaborator-row {
  min-height: 38px; // So that it takes up at least as much as an avatar row

  & > .italics {
    font-style: italic;
  }

  & > .row-title {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
