<template>
  <portal v-if="canRenderSubnavAdminPortal" to="subnav-admin">
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
  STANDARD_PORTAL_KEYS,
  buildPortalStateMixin
} from '@/main/utils/portalStateManager'
export default {
  mixins: [buildPortalStateMixin([STANDARD_PORTAL_KEYS.SubnavAdmin], 'admin-nav', 0)]
}
</script>
