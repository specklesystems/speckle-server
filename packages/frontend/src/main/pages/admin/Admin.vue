<template lang="html">
  <v-container v-if="$apollo.loading" fluid>
    <v-skeleton-loader type="article"></v-skeleton-loader>
  </v-container>

  <v-container v-else-if="isAdmin" class="pa-0">
    <admin-nav />
    <portal v-if="canRenderActionsPortal" to="actions"><div></div></portal>
    <v-container fluid class="pa-0">
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
import {
  claimPortal,
  unclaimPortal,
  portalsState,
  STANDARD_PORTAL_KEYS
} from '@/main/utils/portalStateManager'

export default {
  name: 'AdminPanel',
  components: {
    ErrorPlaceholder: () => import('@/main/components/common/ErrorPlaceholder'),
    AdminNav: () => import('@/main/navigation/AdminNav')
  },
  data() {
    return {
      adminNav: true,
      portalIdentity: 'admin'
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
    },
    canRenderActionsPortal() {
      return (
        portalsState.currentPortals[STANDARD_PORTAL_KEYS.Actions] ===
        this.portalIdentity
      )
    }
  },
  mounted() {
    claimPortal(STANDARD_PORTAL_KEYS.Actions, this.portalIdentity, 0)
  },
  beforeDestroy() {
    unclaimPortal(STANDARD_PORTAL_KEYS.Actions, this.portalIdentity)
  }
}
</script>
