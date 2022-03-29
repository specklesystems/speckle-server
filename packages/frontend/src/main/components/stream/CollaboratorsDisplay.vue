<template>
  <div class="d-inline">
    <user-avatar
      v-for="collab in collaborators.slice(0, collaborators.length > 5 ? 4 : 5)"
      :id="collab.id"
      :key="collab.id"
      :size="size"
      :avatar="collab.avatar"
      :name="collab.name"
    ></user-avatar>
    <span v-if="linkToCollabs">
      <v-btn
        v-if="collaborators.length > 5"
        v-tooltip="`${collaborators.length - 4} more collaborators`"
        icon
        small
        :to="`/streams/${stream.id}/collaborators`"
        class="mt-1"
      >
        <span class="caption">+{{ collaborators.length - 4 }}</span>
      </v-btn>
      <v-btn
        v-if="stream.role === Roles.Stream.Owner && collaborators.length <= 5"
        v-tooltip="'Manage collaborators'"
        icon
        x-small
        :to="`/streams/${stream.id}/collaborators`"
        class="ml-2 mt-1"
      >
        <v-avatar>
          <v-icon>mdi-account-plus</v-icon>
        </v-avatar>
      </v-btn>
    </span>
    <span v-else-if="!linkToCollabs && collaborators.length > 5">
      <span
        v-tooltip="`${collaborators.length - 4} more collaborators`"
        class="caption"
      >
        +{{ collaborators.length - 4 }}
      </span>
    </span>
  </div>
</template>
<script>
import { Roles } from '@/helpers/mainConstants'

export default {
  components: {
    UserAvatar: () => import('@/main/components/common/UserAvatar')
  },
  props: {
    stream: { type: Object, default: () => null },
    size: { type: Number, default: 20 },
    linkToCollabs: { type: Boolean, default: true }
  },
  data() {
    return { Roles }
  },
  computed: {
    collaborators() {
      return this.stream ? this.stream.collaborators : []
    }
  }
}
</script>
