<template>
  <div>
    <portal to="toolbar">Your server at a glance</portal>
    <general-info-card />
    <div class="my-5" />
    <version-info-card />
    <div class="my-5" />
    <activity-card />
  </div>
</template>

<script>
export default {
  name: 'AdminOverview',
  components: {
    GeneralInfoCard: () => import('@/cleanup/components/admin/GeneralInfoCard'),
    ActivityCard: () => import('@/cleanup/components/admin/ActivityCard'),
    VersionInfoCard: () => import('@/cleanup/components/admin/VersionInfoCard')
  }
}
</script>
