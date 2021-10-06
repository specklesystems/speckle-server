<template>
  <div style="display: inline-block">
    <v-menu v-if="loggedIn" offset-x open-on-hover>
      <template #activator="{ on, attrs }">
        <v-avatar
          v-if="userById"
          class="ma-1"
          color="grey lighten-3"
          :size="size"
          v-bind="attrs"
          v-on="on"
        >
          <v-img v-if="avatar" :src="avatar" />
          <v-img v-else :src="`https://robohash.org/` + id + `.png?size=40x40`" />
        </v-avatar>
        <v-avatar v-else class="ma-1" :size="size" v-bind="attrs" v-on="on">
          <v-img contain src="/logo.svg"></v-img>
        </v-avatar>
      </template>
      <v-card v-if="userById && showHover" style="width: 200px" :to="isSelf ? '/profile' : '/profile/' + id">
        <v-card-text v-if="!$apollo.loading" class="text-center">
          <v-avatar class="my-4" color="grey lighten-3" :size="40">
            <v-img v-if="avatar" :src="avatar" />
            <v-img v-else :src="`https://robohash.org/` + id + `.png?size=40x40`" />
          </v-avatar>

          <!-- Uncomment when email verification is in place -->
          <!-- <div v-if="userById.verified" class="mb-1">
            <v-chip color="primary" small>
              <v-icon small class="mr-2">mdi-shield</v-icon>
              verified email
            </v-chip>
          </div> -->

          <div>
            <b>{{ userById.name }}</b>
          </div>
          <div class="caption">
            {{ userById.company }}
            <br />
            {{ userById.bio ? 'Bio: ' + userById.bio : '' }}
          </div>
        </v-card-text>
      </v-card>
      <v-card v-else-if="showHover">
        <v-card-text class="text-xs">
          <b>Speckle Ghost</b>
          <br />
          This user no longer exists.
        </v-card-text>
      </v-card>
    </v-menu>
    <v-avatar v-else-if="showHover" class="ma-1" color="grey lighten-3" :size="size">
      <v-img v-if="avatar" :src="avatar" />
      <v-img v-else :src="`https://robohash.org/` + id + `.png?size=40x40`" />
    </v-avatar>
  </div>
</template>
<script>
import userByIdQuery from '../graphql/userById.gql'

export default {
  props: {
    avatar: String,
    name: String,
    showHover: {
      type: Boolean,
      default: true
    },
    size: {
      type: Number,
      default: 42
    },
    id: {
      type: String,
      default: null
    }
  },
  computed: {
    isSelf() {
      return this.id === localStorage.getItem('uuid')
    },
    loggedIn() {
      return localStorage.getItem('uuid') !== null
    }
  },
  apollo: {
    userById: {
      query: userByIdQuery,
      variables() {
        return {
          id: this.id
        }
      },
      skip() {
        return !this.loggedIn
      },

      update: (data) => {
        return data.user
      }
    }
  }
}
</script>
