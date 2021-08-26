<template>
  <v-chip v-if="targetUser" pill :color="color">
    <v-avatar left>
      <user-avatar
        :id="targetUser.id"
        :avatar="targetUser.avatar"
        :size="30"
        :name="targetUser.name"
      />
    </v-avatar>

    {{ targetUser.name }}
  </v-chip>
</template>
<script>
import gql from 'graphql-tag'
import UserAvatar from './UserAvatar'

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
        query targetUser($id: String) {
          user(id: $id) {
            name
            avatar
            id
          }
        }
      `,
      update: (data) => data.user,
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