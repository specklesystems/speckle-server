<template>
  <v-card
    v-if="!$apollo.loading && action === 0"
    rounded="lg"
    class="py-4 elevation-10"
  >
    <v-card-text class="text-center">
      <user-avatar></user-avatar>
    </v-card-text>
    <v-card-text class="text-h5 font-weight-regular text-center pt-4">
      <v-icon v-if="app.trustByDefault" class="mr-2 primary--text">
        mdi-shield-check
      </v-icon>
      <b class="primary--text">{{ app.name }}</b>
      is requesting access to your Speckle account.
    </v-card-text>
    <v-card-text>
      <v-expansion-panels
        v-if="!app.trustByDefault"
        v-model="panel"
        flat
        hover
        class="py-3"
      >
        <v-expansion-panel>
          <v-expansion-panel-header class="">
            <b>App Info & Requested permissions ({{ app.scopes.length }})</b>
            <template #actions>
              <v-icon color="primary">mdi-alert-circle</v-icon>
            </template>
          </v-expansion-panel-header>
          <v-expansion-panel-content class="">
            <p class="d-flex align-center">
              <b class="mr-1">Author:</b>
              {{ app.author.name }}
              <user-avatar-icon
                :avatar="app.author.avatar"
                :seed="app.author.id"
                :size="20"
                class="ml-1"
              ></user-avatar-icon>
            </p>
            <p>
              <b>Description:</b>
              {{ app.description ? app.description : 'No description provided.' }}
            </p>
            <v-divider class="mb-4" />
            <p><b>Permissions:</b></p>
            <template v-for="scope in app.scopes">
              <p :key="scope.name" class="caption">
                <b>{{ scope.name }}</b>
                &nbsp;
                <span class="text--disabled">{{ scope.description }}</span>
              </p>
            </template>
          </v-expansion-panel-content>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-card-text>
    <v-card-actions class="justify-center px-10">
      <v-btn color="error" style="width: 50%" @click="deny">Deny</v-btn>
      <v-btn color="primary" style="width: 50%" @click="allow">Allow</v-btn>
    </v-card-actions>
    <v-card-text class="caption text-center">
      Clicking allow will redirect you to {{ app.redirectUrl }}
    </v-card-text>
  </v-card>
  <v-card v-else>
    <v-card-text v-if="action === 1" class="text-center">
      <b>Permission granted.</b>
      You can now close this window.
    </v-card-text>
    <v-card-text v-if="action === -1" class="text-center">
      <b>Permission denied.</b>
      You can now close this window.
    </v-card-text>
  </v-card>
</template>
<script>
import { gql } from '@apollo/client/core'
import UserAvatar from '@/main/components/auth/UserAvatarAuthoriseApp'
import UserAvatarIcon from '@/main/components/common/UserAvatarIcon'
import { AppLocalStorage } from '@/utils/localStorage'

export default {
  name: 'AuthorizeApp',
  components: { UserAvatar, UserAvatarIcon },
  apollo: {
    app: {
      query: gql`
        query getApp($id: String!) {
          app(id: $id) {
            id
            name
            description
            trustByDefault
            redirectUrl
            scopes {
              name
              description
            }
            author {
              name
              id
              avatar
            }
          }
        }
      `,
      variables() {
        return {
          id: this.$route.params.appId
        }
      }
    }
  },
  data() {
    return {
      panel: [],
      action: 0
    }
  },
  computed: {
    denyUrl() {
      return `${this.app.redirectUrl}?denied=true`
    },
    selfUserId() {
      return AppLocalStorage.get('uuid')
    }
  },
  watch: {
    app(newVal) {
      if (newVal && newVal.trustByDefault) {
        this.allow()
      }
    }
  },
  methods: {
    async deny() {
      this.action = -1
      this.$mixpanel.track('App Authorization', { allow: false, type: 'action' })
      window.location.replace(this.denyUrl)
    },
    async allow() {
      this.action = 1
      this.$mixpanel.track('App Authorization', { allow: true, type: 'action' })
      window.location.replace(
        `${window.location.origin}/auth/accesscode?appId=${this.app.id}&challenge=${
          this.$route.params.challenge
        }&token=${AppLocalStorage.get('AuthToken')}`
      )
    }
  }
}
</script>
