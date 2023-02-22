<template>
  <v-chip pill :color="color">
    <template v-if="targetUser">
      <v-avatar left>
        <user-avatar
          :id="targetUser.id"
          :avatar="targetUser.avatar"
          :size="30"
          :name="targetUser.name"
        />
      </v-avatar>

      {{ targetUser.name }}
    </template>
    <template v-else>Deleted user</template>
  </v-chip>
</template>
<script>
import { gql } from '@apollo/client/core'
import UserAvatar from '@/main/components/common/UserAvatar'

export default {
  components: { UserAvatar },
  props: {
    userId: {
      type: String,
      default: null
    },
    color: {
      type: String,
      default: null
    }
  },
  apollo: {
    targetUser: {
      query: gql`
        query targetUser($id: String!) {
          otherUser(id: $id) {
            name
            avatar
            id
          }
        }
      `,
      update: (data) => data.otherUser,
      variables() {
        return {
          id: this.userId
        }
      },
      skip() {
        return !this.userId
      }
    }
  },
  data() {
    return {}
  }
}
</script>
