<template>
  <div id="admin-overview">
    <!-- Dynamically register page cards-->
    <component v-for="comp in cards" :key="comp.name" :is="comp" outlined/>
  </div>
</template>

<script>
import VersionInfoCard from "@/components/admin/VersionInfoCard";
import ActivityCard from "@/components/admin/ActivityCard";
import GeneralInfoCard from "@/components/admin/GeneralInfoCard";

export default {
  name: "AdminOverview",
  data() {
    return {
      cards: [GeneralInfoCard, ActivityCard, VersionInfoCard]
    };
  }
};
</script>

<style scoped lang="scss">
#admin-overview {
  .v-card:not(:last-child) {
    margin-bottom: 1em;
  }
}
</style>
