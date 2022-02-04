<template>
  <div style="display: inline-block">
    <v-menu v-if="$loggedIn()" offset-x open-on-hover>
      <template #activator="{ on, attrs }">
        <div v-bind="attrs" v-on="on">
          <user-avatar-icon
            v-if="userById"
            :size="size"
            :avatar="userById.avatar"
            :seed="id"
            v-bind="attrs"
            :class="`${margin ? 'ma-1' : ''} ${shadow ? 'elevation-5' : ''}`"
          ></user-avatar-icon>
          <v-avatar
            v-else
            :class="`${margin ? 'ma-1' : ''} ${shadow ? 'elevation-5' : ''}`"
            :size="size"
          >
            <v-img contain src="/logo.svg"></v-img>
          </v-avatar>
        </div>
      </template>
      <v-card v-if="userById && showHover" style="width: 200px">
        <v-card-text v-if="!$apollo.loading">
          <div>
            <b>
              {{ userById.name }}
              <v-icon
                v-if="userById.verified"
                v-tooltip="'Verfied email'"
                x-small
                class="mr-2 primary--text"
              >
                mdi-shield-check
              </v-icon>
            </b>
          </div>
          <div class="caption mt-2">
            <div>
              <v-icon x-small>mdi-domain</v-icon>
              {{ userById.company ? userById.company : 'No company info.' }}
            </div>
            <div v-if="userById.bio" class="text-truncate">
              <v-icon x-small>mdi-information-outline</v-icon>
              {{ userById.bio }}
            </div>
          </div>
          <div class="mt-2">
            <v-btn x-small block :to="isSelf ? '/profile' : '/profile/' + id">View profile</v-btn>
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
      :class="`${margin ? 'ma-1' : ''} ${shadow ? 'elevation-5' : ''}`"
      :size="size"
      :avatar="avatar"
      :seed="id"
    ></user-avatar-icon>
  </div>
</template>
<script>
import userByIdQuery from '@/graphql/userById.gql'
import UserAvatarIcon from '@/main/components/common/UserAvatarIcon'

export default {
  components: { UserAvatarIcon },
  props: {
    avatar: { type: String, default: null },
    name: { type: String, default: null },
    showHover: {
      type: Boolean,
      default: true
    },
    shadow: {
      type: Boolean,
      default: false
    },
    margin: {
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
        return !this.$loggedIn
      },
      update: (data) => {
        return data.user
      }
    }
  }
}
</script>
