<template>
  <div v-if="user" style="display: inline-block" class="text-center">
    <v-avatar class="ma-1" color="grey lighten-3" :size="size">
      <v-img v-if="user.avatar" :src="user.avatar" />
      <v-img v-else :src="`https://robohash.org/` + id + `.png?size=40x40`" />
    </v-avatar>
    <p class="text-h6 mt-4">
      {{ user.name }}
      <br />
      <a class="text-body-2" @click="signOut">Not you? Switch accounts.</a>
    </p>
  </div>
</template>
<script>
import { signOut } from '@/auth-helpers'
import userQuery from '../graphql/userById.gql'

export default {
  props: {
    size: {
      type: Number,
      default: 42
    },
    id: {
      type: String,
      default: () => localStorage.getItem('uuid')
    }
  },
  computed: {
    isSelf() {
      return this.id === localStorage.getItem('uuid')
    },
    loggedInUserId() {
      return localStorage.getItem('uuid')
    }
  },
  apollo: {
    user: {
      query: userQuery,
      variables() {
        return {
          id: this.id
        }
      }
    }
  },
  methods: {
    signOut() {
      signOut()
    }
  }
}
</script>
