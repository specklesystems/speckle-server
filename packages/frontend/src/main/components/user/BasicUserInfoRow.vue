<template>
  <v-list-item :inactive="inactive" :ripple="!inactive" @click="$emit('click', $event)">
    <v-list-item-avatar>
      <user-avatar
        :id="user.id"
        :name="user.name"
        :avatar="user.avatar"
        :size="25"
        class="ml-1"
      ></user-avatar>
    </v-list-item-avatar>
    <v-list-item-content>
      <v-list-item-title>{{ user.name }}</v-list-item-title>
      <v-list-item-subtitle>
        {{ company }}
      </v-list-item-subtitle>
    </v-list-item-content>
    <v-list-item-action v-if="$slots.actions">
      <slot name="actions" />
    </v-list-item-action>
  </v-list-item>
</template>
<script lang="ts">
import { LimitedUserFieldsFragment } from '@/graphql/generated/graphql'
import Vue, { PropType } from 'vue'
import UserAvatar from '@/main/components/common/UserAvatar.vue'

/**
 * Use this wherever you need to output some basic & publicly available user info
 * (outside the admin panel, which would show full user info)
 *
 * Events:
 * @click
 *
 * Slots:
 * #actions
 */

export default Vue.extend({
  name: 'BasicUserInfoRow',
  components: {
    UserAvatar
  },
  props: {
    user: {
      type: Object as PropType<LimitedUserFieldsFragment>,
      required: true
    },
    inactive: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    company(): string {
      return this.user.company ? this.user.company : 'no company info'
    }
  }
})
</script>
