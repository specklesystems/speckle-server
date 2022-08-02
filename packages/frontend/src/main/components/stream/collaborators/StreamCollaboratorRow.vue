<template>
  <div class="d-flex flex-grow-1 align-center">
    <div class="pr-1">
      <user-avatar
        :id="user.id"
        :key="user.id"
        :avatar="user.avatar"
        :name="user.name"
        :size="30"
      />
    </div>
    <div class="pr-1">{{ user.name }}</div>
    <div class="flex-grow-1 text-right">
      <!-- <v-btn x-small color="primary">change</v-btn> -->
      <v-menu offset-y>
        <template #activator="{ on, attrs }">
          <v-btn x-small color="" dark v-bind="attrs" :disabled="disabled" v-on="on">
            Change
          </v-btn>
        </template>
        <v-list dense>
          <v-list-item
            v-for="(item, index) in roles.filter((r) => r.name !== user.role)"
            :key="index"
            @click="$emit('update-user-role', { user, role: item })"
          >
            <v-list-item-action>
              <v-icon small>mdi-chevron-right</v-icon>
            </v-list-item-action>
            <v-list-item-title>{{ item.name }}</v-list-item-title>
          </v-list-item>
          <v-list-item @click="$emit('remove-user', user)">
            <v-list-item-action>
              <v-icon small class="red--text text--red">mdi-close</v-icon>
            </v-list-item-action>
            <v-list-item-title class="red--text text--red">remove</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </div>
  </div>
</template>
<script lang="ts">
import { StreamCollaboratorFieldsFragment, Role } from '@/graphql/generated/graphql'
import Vue, { PropType } from 'vue'

export default Vue.extend({
  name: 'StreamCollaboratorRow',
  components: {
    UserAvatar: () => import('@/main/components/common/UserAvatar.vue')
  },
  props: {
    user: {
      type: Object as PropType<StreamCollaboratorFieldsFragment>,
      required: true
    },
    roles: { type: Array as PropType<Role[]>, required: true },
    disabled: { type: Boolean, default: false }
  }
})
</script>
