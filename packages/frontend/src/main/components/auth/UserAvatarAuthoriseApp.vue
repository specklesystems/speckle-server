<template>
  <div v-if="user" style="display: inline-block" class="text-center">
    <user-avatar-icon
      :size="size"
      :avatar="user.avatar"
      :seed="user.id"
    ></user-avatar-icon>
    <p class="text-h6 mt-4">
      {{ user.name }}
      <br />
      <a class="text-body-2" @click="signOut">Not you? Switch accounts.</a>
    </p>
  </div>
</template>
<script>
import { signOut } from '@/plugins/authHelpers'
import userQuery from '@/graphql/userById.gql'
import UserAvatarIcon from '@/main/components/common/UserAvatarIcon'
import { AppLocalStorage } from '@/utils/localStorage'

export default {
  components: { UserAvatarIcon },
  props: {
    size: {
      type: Number,
      default: 42
    },
    id: {
      type: String,
      default: () => AppLocalStorage.get('uuid')
    }
  },
  computed: {
    isSelf() {
      return this.id === AppLocalStorage.get('uuid')
    },
    loggedInUserId() {
      return AppLocalStorage.get('uuid')
    }
  },
  apollo: {
    user: {
      query: userQuery,
      variables() {
        return {
          id: this.id
        }
      },
      update(data) {
        return data.otherUser
      }
    }
  },
  methods: {
    signOut() {
      signOut(this.$mixpanel)
    }
  }
}
</script>
