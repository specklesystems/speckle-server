<template>
  <v-container class="pa-0" fluid>
    <portal v-if="canRenderToolbarPortal" to="toolbar"><b>Your Profile</b></portal>
    <v-row>
      <v-col cols="12" lg="4">
        <user-info-card :user="user" @update="update"></user-info-card>
      </v-col>
      <v-col cols="12" lg="8">
        <section-card v-if="user && user.notificationPreferences" expandable>
          <template #header><b>Notification preferences</b></template>
          <user-notification-preferences :user="user" />
        </section-card>
        <section-card expandable class="my-10">
          <template #header><b>Authorized Apps</b></template>
          <user-authorised-apps />
        </section-card>
        <section-card v-if="!isGuestUser" expandable class="mt-6 mb-10">
          <template #header><b>Developer Settings</b></template>
          <v-alert type="info" color="primary" dense class="my-2 mx-4">
            Heads up! The sections below are intended for developers.
          </v-alert>
          <v-alert type="success" dense class="mb-2 mx-4">
            Trying to learn the API?
            <a
              href="/explorer"
              target="_blank"
              class="white--text font-weight-bold text-decoration-none"
            >
              Checkout the GraphIQL explorer
              <v-icon small class="mb-1">mdi-open-in-new</v-icon>
            </a>
          </v-alert>
          <div class="pa-4">
            <user-access-tokens />
            <br />
            <user-apps />
          </div>
        </section-card>

        <user-delete-card :user="user" />
      </v-col>
    </v-row>
  </v-container>
</template>
<script>
import { profileSelfQuery } from '@/graphql/user'
import { signOut } from '@/plugins/authHelpers'
import {
  STANDARD_PORTAL_KEYS,
  buildPortalStateMixin
} from '@/main/utils/portalStateManager'
import UserNotificationPreferences from '@/main/components/user/UserNotificationPreferences'
import { isGuest } from '@/main/lib/core/helpers/users'

export default {
  name: 'TheProfileSelf',
  components: {
    SectionCard: () => import('@/main/components/common/SectionCard'),
    UserInfoCard: () => import('@/main/components/user/UserInfoCard'),
    UserAccessTokens: () => import('@/main/components/user/UserAccessTokens'),
    UserApps: () => import('@/main/components/user/UserApps'),
    UserAuthorisedApps: () => import('@/main/components/user/UserAuthorisedApps'),
    UserDeleteCard: () => import('@/main/components/user/UserDeleteCard'),
    UserNotificationPreferences
  },
  mixins: [
    buildPortalStateMixin([STANDARD_PORTAL_KEYS.Toolbar], 'user-profile-self', 1)
  ],
  apollo: {
    user: {
      query: profileSelfQuery,
      update: (data) => data.activeUser
    }
  },
  computed: {
    isGuestUser() {
      return isGuest(this.user)
    }
  },
  methods: {
    update() {
      this.$apollo.queries.user.refetch()
    },
    signOut() {
      signOut(this.$mixpanel)
    }
  }
}
</script>
<style scoped>
.v-item-group {
  float: left;
}

.clear {
  clear: both;
}
</style>
