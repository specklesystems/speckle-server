<template>
  <div>
    <portal v-if="canRenderToolbarPortal" to="toolbar">Your server at a glance</portal>
    <general-info-card />
    <div class="my-5" />
    <version-info-card />
    <div class="my-5" />
    <activity-card />
  </div>
</template>

<script>
import {
  claimPortal,
  unclaimPortal,
  portalsState,
  STANDARD_PORTAL_KEYS
} from '@/main/utils/portalStateManager'

export default {
  name: 'AdminOverview',
  components: {
    GeneralInfoCard: () => import('@/main/components/admin/GeneralInfoCard'),
    ActivityCard: () => import('@/main/components/admin/ActivityCard'),
    VersionInfoCard: () => import('@/main/components/admin/VersionInfoCard')
  },
  data: () => ({ portalIdentity: 'admin-dashboard' }),
  computed: {
    canRenderToolbarPortal() {
      return (
        portalsState.currentPortals[STANDARD_PORTAL_KEYS.Toolbar] ===
        this.portalIdentity
      )
    }
  },
  mounted() {
    claimPortal(STANDARD_PORTAL_KEYS.Toolbar, this.portalIdentity, 1)
  },
  beforeDestroy() {
    unclaimPortal(STANDARD_PORTAL_KEYS.Toolbar, this.portalIdentity)
  }
}
</script>
