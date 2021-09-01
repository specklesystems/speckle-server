<template>
  <div id="admin-overview">
    <component v-for="comp in cards" :key="comp.name" :is="comp" />
  </div>
</template>

<script>
import GeneralInfoCard from '@/components/admin/GeneralInfoCard'
import VersionInfoCard from '@/components/admin/VersionInfoCard'
import ActivityCard from '@/components/admin/ActivityCard'

export default {
  name: 'AdminOverview',
  data() {
    return {
      cards: [GeneralInfoCard, ActivityCard, VersionInfoCard]
    }
  }
}
</script>

<style scoped lang="scss">
#admin-overview {
  .v-card:not(:last-child) {
    margin-bottom: 1em;
  }
}
</style>
