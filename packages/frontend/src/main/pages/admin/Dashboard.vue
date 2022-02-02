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
    GeneralInfoCard: () => import('@/main/components/admin/GeneralInfoCard'),
    ActivityCard: () => import('@/main/components/admin/ActivityCard'),
    VersionInfoCard: () => import('@/main/components/admin/VersionInfoCard')
  }
}
</script>
