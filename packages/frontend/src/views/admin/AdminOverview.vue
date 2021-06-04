<template>
  <div id="admin-overview">
    <server-info-admin-card/>
    <usage-info-card/>
    <version-info-card/>
  </div>
</template>

<script>
import ServerInfoAdminCard from "@/components/admin/ServerInfoCard";
import VersionInfoCard from "@/components/admin/VersionInfoCard";
import UsageInfoCard from "@/components/admin/UsageInfoCard";
export default {
  name: "AdminOverview",
  components: { UsageInfoCard, VersionInfoCard, ServerInfoAdminCard },
};
</script>

<style scoped lang="scss">
#admin-overview {
  .v-card:not(:last-child) {
    margin-bottom: 1em;
  }
}
</style>
