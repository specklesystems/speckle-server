<template>
  <div id="admin-settings">
    <server-info-admin-card/>
    <!--    <server-admins-card/>-->
  </div>
</template>

<script>
import ServerInfoAdminCard from "@/components/admin/ServerInfoCard";
import ServerAdminsCard from "@/components/admin/ServerAdminsCard";

export default {
  name: "AdminSettings",
  components: { ServerAdminsCard, ServerInfoAdminCard }
};
</script>

<style scoped lang="scss">
#admin-settings {
  .v-card:not(:last-child) {
    margin-bottom: 1em;
  }
}
</style>
