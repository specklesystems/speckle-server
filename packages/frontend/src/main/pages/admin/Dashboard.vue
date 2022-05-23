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
  STANDARD_PORTAL_KEYS,
  buildPortalStateMixin
} from '@/main/utils/portalStateManager'

export default {
  name: 'AdminOverview',
  components: {
    GeneralInfoCard: () => import('@/main/components/admin/GeneralInfoCard'),
    ActivityCard: () => import('@/main/components/admin/ActivityCard'),
    VersionInfoCard: () => import('@/main/components/admin/VersionInfoCard')
  },
  mixins: [buildPortalStateMixin([STANDARD_PORTAL_KEYS.Toolbar], 'admin-dashboard', 1)]
}
</script>
