<template>
  <section-card expandable>
    <template slot="header">
      <span class="text-capitalize">{{ role.name.split(':')[1] }}s</span>
    </template>
    <template slot="actions">
      <v-spacer></v-spacer>
      <v-badge
        inline
        :content="count"
        :color="`grey ${$vuetify.theme.dark ? 'darken-1' : 'lighten-1'}`"
      ></v-badge>
    </template>
    <v-card-text class="flex-grow-1">
      {{ role.description }}
    </v-card-text>
    <v-card-text class="d-flex flex-column justify-space-between">
      <!-- Pending collaborators first -->
      <div
        v-for="pendingCollaborator in pendingCollaborators"
        :key="pendingCollaborator.inviteId"
        class="d-flex flex-column"
      >
        <stream-pending-collaborator-row
          :pending-collaborator="pendingCollaborator"
          :disabled="disabled"
          @cancel-invite="
            $emit('cancel-invite', { inviteId: pendingCollaborator.inviteId })
          "
        />
      </div>

      <!-- Active collaborators -->
      <div
        v-for="user in collaborators"
        :key="user.id"
        class="d-flex align-center mb-2"
      >
        <stream-collaborator-row
          :user="user"
          :roles="roles"
          :disabled="disabled"
          @update-user-role="$emit('update-user-role', $event)"
          @remove-user="$emit('remove-user', $event)"
        />
      </div>
    </v-card-text>
  </section-card>
</template>
<script lang="ts">
import {
  StreamWithCollaboratorsQuery,
  StreamCollaborator
} from '@/graphql/generated/graphql'
import Vue, { PropType } from 'vue'
import type { Get } from 'type-fest'
import StreamCollaboratorRow from '@/main/components/stream/collaborators/StreamCollaboratorRow.vue'
import SectionCard from '@/main/components/common/SectionCard.vue'
import StreamPendingCollaboratorRow from '@/main/components/stream/collaborators/StreamPendingCollaboratorRow.vue'
import { Roles } from '@speckle/shared'

type RoleItem = {
  name: string
  description: string
}

export default Vue.extend({
  name: 'StreamRoleCollaborators',
  components: {
    StreamCollaboratorRow,
    SectionCard,
    StreamPendingCollaboratorRow
  },
  props: {
    roleName: {
      type: String,
      required: true
    },
    roles: {
      type: Array as PropType<RoleItem[]>,
      required: true
    },
    stream: {
      type: Object as PropType<
        NonNullable<Get<StreamWithCollaboratorsQuery, 'stream'>>
      >,
      required: true
    },
    disabledUpdates: Boolean
  },
  computed: {
    role(): RoleItem {
      const role = this.roles.find((r) => r.name === this.roleName)
      if (!role) {
        throw new Error('Invalid role name provided')
      }

      return role
    },
    disabled(): boolean {
      return this.stream.role !== Roles.Stream.Owner || this.disabledUpdates
    },
    collaborators(): StreamCollaborator[] {
      return this.stream.collaborators.filter((c) => c.role === this.roleName)
    },
    pendingCollaborators(): NonNullable<
      Get<StreamWithCollaboratorsQuery, 'stream.pendingCollaborators'>
    > {
      return (this.stream.pendingCollaborators || []).filter(
        (c) => c.role === this.roleName
      )
    },
    count(): string {
      return this.collaborators.length + ''
    }
  }
})
</script>
