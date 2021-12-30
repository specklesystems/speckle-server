<template>
  <div>
    <!-- Speckle Logo -->
    <v-card
      class="space-grotesk primary--text text-h6 pt-5 mb-2 px-5 elevation-0"
      :class="`grey ${$vuetify.theme.dark ? 'darken-4' : 'lighten-4'}`"
      style="position: sticky; top: 0; z-index: 10; width: 99%"
    >
      <router-link to="/" class="text-decoration-none">
        <v-img
          class="mt-2 hover-tada"
          width="20"
          src="@/assets/specklebrick.png"
          style="display: inline-block"
        />
      </router-link>
      <router-link
        to="/"
        class="text-decoration-none"
        style="position: relative; top: -2px; margin-left: 38px"
      >
        <span class="pb-4"><b>Speckle</b></span>
      </router-link>
    </v-card>

    <portal-target name="nav">
      <!-- Main Actions -->
      <v-list dense nav>
        <v-subheader>Actions</v-subheader>
        <v-list-item class="primary" dark @click="newStreamDialog = true">
          <v-list-item-icon>
            <v-icon small class="">mdi-plus-box</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>New Stream</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item @click="inviteUsersDialog = true">
          <v-list-item-icon>
            <v-icon small class="">mdi-email</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Send Invite</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>

      <!-- Main Navigation -->

      <v-list dense nav>
        <v-subheader>Navigation</v-subheader>
        <v-list-item link to="/">
          <v-list-item-icon>
            <v-icon class="mt-2">mdi-clock-outline</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Feed</v-list-item-title>
            <v-list-item-subtitle class="caption">Latest events</v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
        <v-list-item link to="/streams">
          <v-list-item-icon>
            <v-icon class="mt-2">mdi-folder-outline</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Streams</v-list-item-title>
            <v-list-item-subtitle class="caption">All your streams</v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
        <v-list-item v-if="user && user.role === 'server:admin'" link to="/admin">
          <v-list-item-icon>
            <v-icon class="mt-2">mdi-cog-outline</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Admin</v-list-item-title>
            <v-list-item-subtitle class="caption">Server Management</v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>

        <v-list-item v-if="user" link to="/profile">
          <v-list-item-icon>
            <user-avatar-icon
              class="mt-1"
              :size="24"
              :avatar="user.avatar"
              :seed="user.id"
            ></user-avatar-icon>
          </v-list-item-icon>

          <v-list-item-content>
            <v-list-item-title>Profile</v-list-item-title>
            <v-list-item-subtitle class="caption">Settings & Security</v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </portal-target>

    <!-- Dialogs  -->

    <v-dialog v-model="newStreamDialog" max-width="500" :fullscreen="$vuetify.breakpoint.xsOnly">
      <new-stream @created="newStreamDialog = false" @close="newStreamDialog = false" />
    </v-dialog>

    <v-dialog v-model="inviteUsersDialog" max-width="500" :fullscreen="$vuetify.breakpoint.xsOnly">
      <server-invites @close="inviteUsersDialog = false" />
    </v-dialog>
  </div>
</template>
<script>
import userQuery from '@/graphql/user.gql'
export default {
  components: {
    NewStream: () => import('@/cleanup/dialogs/NewStream'),
    ServerInvites: () => import('@/cleanup/dialogs/ServerInvites'),
    UserAvatarIcon: () => import('@/cleanup/components/common/UserAvatarIcon')
  },
  apollo: {
    user: {
      query: userQuery
    }
  },
  data() {
    return {
      newStreamDialog: false,
      inviteUsersDialog: false
    }
  },
  mounted() {
    this.$eventHub.$on('show-new-stream-dialog', () => (this.newStreamDialog = true))
  },
  methods: {
    switchTheme() {
      this.$vuetify.theme.dark = !this.$vuetify.theme.dark
      localStorage.setItem('darkModeEnabled', this.$vuetify.theme.dark ? 'dark' : 'light')
    }
  }
}
</script>
