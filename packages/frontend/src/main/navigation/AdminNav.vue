<template>
  <portal v-if="canRenderSubnavPortal" to="subnav-admin">
    <v-list class="ml-12 pr-0" dense nav subheader>
      <v-list-item to="/admin/dashboard" exact>
        <v-list-item-content>
          <v-list-item-title>Dashboard</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
      <v-list-item to="/admin/settings" exact>
        <v-list-item-content>
          <v-list-item-title>Info and Settings</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
      <v-divider class="my-1" />
      <v-list-item to="/admin/users">
        <v-list-item-content>
          <v-list-item-title>Users</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
      <v-list-item to="/admin/invites" exact>
        <v-list-item-content>
          <v-list-item-title>Bulk Invites</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
      <v-divider class="my-1" />
      <v-list-item to="/admin/streams">
        <v-list-item-content>
          <v-list-item-title>Streams</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
    </v-list>
  </portal>
</template>
<script>
import {
  claimPortal,
  unclaimPortal,
  portalsState,
  STANDARD_PORTAL_KEYS
} from '@/main/utils/portalStateManager'
export default {
  data: () => ({ portalIdentity: 'admin-nav' }),
  computed: {
    canRenderSubnavPortal() {
      return (
        portalsState.currentPortals[STANDARD_PORTAL_KEYS.SubnavAdmin] ===
        this.portalIdentity
      )
    }
  },
  mounted() {
    claimPortal(STANDARD_PORTAL_KEYS.SubnavAdmin, this.portalIdentity, 0)
  },
  beforeDestroy() {
    unclaimPortal(STANDARD_PORTAL_KEYS.SubnavAdmin, this.portalIdentity)
  }
}
</script>
