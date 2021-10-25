<template>
  <div style="display: inline-block">
    <v-menu v-if="loggedIn" offset-x open-on-hover>
      <template #activator="{ on, attrs }">
        <div v-bind="attrs" v-on="on">
          <user-avatar-icon
            v-if="userById"
            :size="size"
            :avatar="userById.avatar"
            :seed="id"
            v-bind="attrs"
            class="ma-1"
          ></user-avatar-icon>
          <v-avatar v-else class="ma-1" :size="size">
            <v-img contain src="/logo.svg"></v-img>
          </v-avatar>
        </div>
      </template>
      <v-card
        v-if="userById && showHover"
        style="width: 200px"
        :to="isSelf ? '/profile' : '/profile/' + id"
      >
        <v-card-text v-if="!$apollo.loading" class="text-center">
          <user-avatar-icon class="my-4" :size="40" :avatar="avatar" :seed="id"></user-avatar-icon>

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
    <user-avatar-icon
      v-else
      class="ma-1"
      :size="size"
      :avatar="avatar"
      :seed="id"
    ></user-avatar-icon>
  </div>
</template>
<script>
import userByIdQuery from '../graphql/userById.gql'
import UserAvatarIcon from '@/components/UserAvatarIcon'

export default {
  components: { UserAvatarIcon },
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
