<template lang="html">
  <v-container v-if="$apollo.loading" fluid>
    <v-skeleton-loader type="article"></v-skeleton-loader>
  </v-container>

  <v-container v-else-if="isAdmin" :class="`${$vuetify.breakpoint.xsOnly ? 'pl-0' : ''}`">
    <v-navigation-drawer
      v-model="adminNav"
      app
      fixed
      :permanent="adminNav && !$vuetify.breakpoint.smAndDown"
      :style="`${!$vuetify.breakpoint.xsOnly ? 'left: 56px' : ''}`"
    >
      <v-app-bar style="position: absolute; top: 0; width: 100%; z-index: 90" elevation="0">
        <v-toolbar-title>Server Admin</v-toolbar-title>
      </v-app-bar>

      <v-list style="margin-top: 64px; padding-left: 10px" rounded>
        <v-list-item link to="/admin/dashboard">
          <v-list-item-icon>
            <v-icon small class="mt-1">mdi-view-dashboard</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Dashboard</v-list-item-title>
            <v-list-item-subtitle class="caption">
              Various server stats at a glance.
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>

        <v-list-item link to="/admin/settings">
          <v-list-item-icon>
            <v-icon small class="mt-1">mdi-tune</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Settings</v-list-item-title>
            <v-list-item-subtitle class="caption">
              Edit various server settings.
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>

        <v-list-item link to="/admin/users">
          <v-list-item-icon>
            <v-icon small class="mt-1">mdi-account-group</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Users</v-list-item-title>
            <v-list-item-subtitle class="caption">Edit server user details.</v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>

        <v-list-item link to="/admin/invites">
          <v-list-item-icon>
            <v-icon small class="mt-1">mdi-account-multiple-plus-outline</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Server invites</v-list-item-title>
            <v-list-item-subtitle class="caption">Manage server invitations.</v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>

        <v-list-item link to="/admin/streams">
          <v-list-item-icon>
            <v-icon small class="mt-1">mdi-blur</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Streams</v-list-item-title>
            <v-list-item-subtitle class="caption">Manage streams.</v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-app-bar
      v-if="!adminNav"
      app
      :style="`${!$vuetify.breakpoint.xsOnly ? 'padding-left: 56px' : ''}`"
      flat
    >
      <v-app-bar-nav-icon v-if="!adminNav" @click="adminNav = !adminNav" />
      <v-toolbar-title v-if="!adminNav">Server Admin</v-toolbar-title>
    </v-app-bar>

    <v-container
      :style="`${!$vuetify.breakpoint.xsOnly ? 'padding-left: 56px;' : ''} max-width: 1024px;`"
      fluid
      pt-4
      pr-0
    >
      <transition name="fade">
        <router-view></router-view>
      </transition>
    </v-container>
  </v-container>
  <v-container v-else-if="!isAdmin">
    <error-placeholder error-type="access">
      <h2>Only server admins have access to this section.</h2>
    </error-placeholder>
  </v-container>
</template>

<script>
import gql from 'graphql-tag'

export default {
  name: 'AdminPanel',
  components: {
    ErrorPlaceholder: () => import('@/components/ErrorPlaceholder')
  },
  data() {
    return {
      adminNav: true
    }
  },
  apollo: {
    user: {
      query: gql`
        query {
          user {
            role
            id
          }
        }
      `,
      prefetch: true
    }
  },
  computed: {
    isAdmin() {
      return this.user?.role === 'server:admin'
    }
  }
}
</script>
