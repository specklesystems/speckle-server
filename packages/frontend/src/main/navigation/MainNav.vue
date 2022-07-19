<template>
  <div>
    <main-logo
      :shadow="shadowSpeckle"
      :expanded="expanded"
      @hide-drawer="$emit('hide-drawer')"
    />

    <portal-target name="nav">
      <!-- Main Actions -->
      <v-list v-if="true" dense nav class="mb-0 pb-0">
        <v-list-item class="primary elevation-5" dark @click="newStreamDialog = true">
          <v-list-item-icon>
            <v-icon class="">mdi-folder-plus</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>New Stream</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item @click="inviteUsersDialog = true">
          <v-list-item-icon>
            <v-icon class="">mdi-email</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Send Invite</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-divider />
      </v-list>

      <!-- Main Navigation -->
      <v-list dense nav class="mt-0 pt-012">
        <v-list-item link to="/">
          <v-list-item-icon>
            <v-icon class="mt-2">mdi-clock-outline</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Feed</v-list-item-title>
            <v-list-item-subtitle class="caption">Latest events</v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
        <portal-target name="subnav-feed" />

        <v-list-item link to="/streams" exact>
          <v-list-item-icon>
            <v-icon class="mt-2">mdi-folder-outline</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Streams</v-list-item-title>
            <v-list-item-subtitle class="caption">
              All your streams
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
        <v-list
          v-show="$route.name.includes('streams')"
          class="ml-12 pr-0"
          dense
          nav
          subheader
        >
          <v-list-item to="/streams/favorite" exact>
            <v-list-item-content>
              <v-list-item-title>
                <v-icon x-small color="red">mdi-heart</v-icon>
                Favorites
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>
        <portal-target name="subnav-streams" />

        <v-list-item link to="/commits">
          <v-list-item-icon>
            <v-icon class="mt-2">mdi-source-commit</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Commits</v-list-item-title>
            <v-list-item-subtitle class="caption">
              Your latest commits
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
        <portal-target name="subnav-commits" />

        <v-list-item v-if="user && user.role === 'server:admin'" exact link to="/admin">
          <v-list-item-icon>
            <v-icon class="mt-2">mdi-cog-outline</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Admin</v-list-item-title>
            <v-list-item-subtitle class="caption">
              Server Management
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
        <portal-target name="subnav-admin" />

        <v-list-item v-if="user" link exact to="/profile">
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
            <v-list-item-subtitle class="caption">
              Settings & Security
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
        <portal-target name="subnav-profile" />
      </v-list>
    </portal-target>

    <!-- Dialogs  -->
    <v-dialog
      v-model="newStreamDialog"
      max-width="500"
      :fullscreen="$vuetify.breakpoint.xsOnly"
    >
      <new-stream @created="newStreamDialog = false" @close="newStreamDialog = false" />
    </v-dialog>

    <invite-dialog :visible.sync="inviteUsersDialog" />
  </div>
</template>
<script>
import { mainUserDataQuery } from '@/graphql/user'
import InviteDialog from '@/main/dialogs/InviteDialog.vue'
import { setDarkTheme } from '@/main/utils/themeStateManager'

export default {
  components: {
    MainLogo: () => import('@/main/navigation/MainLogo'),
    NewStream: () => import('@/main/dialogs/NewStream'),
    InviteDialog,
    UserAvatarIcon: () => import('@/main/components/common/UserAvatarIcon')
  },
  props: {
    expanded: { type: Boolean, default: false },
    drawer: { type: Boolean, default: true }
  },
  apollo: {
    user: {
      query: mainUserDataQuery,
      skip() {
        return !this.$loggedIn()
      }
    }
  },
  data() {
    return {
      newStreamDialog: false,
      inviteUsersDialog: false,
      shadowSpeckle: false
    }
  },
  mounted() {
    const navContent = [
      ...document.getElementsByClassName('v-navigation-drawer__content')
    ][0]
    navContent.addEventListener('scroll', () => {
      if (navContent.scrollTop > 50) this.shadowSpeckle = true
      else this.shadowSpeckle = false
    })
    this.$eventHub.$on('show-new-stream-dialog', () => (this.newStreamDialog = true))
  },
  methods: {
    switchTheme() {
      this.$vuetify.theme.dark = !this.$vuetify.theme.dark
      setDarkTheme(this.$vuetify.theme.dark, true)

      this.$mixpanel.people.set(
        'Theme Web',
        this.$vuetify.theme.dark ? 'dark' : 'light'
      )
    }
  }
}
</script>
