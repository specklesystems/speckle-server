<template>
  <admin-card title="Version Info">
    <template v-slot:menu>
      <span v-if="isLatestVersion" class="text--h6 success--text">
        <v-icon size="medium" color="success">mdi-check-bold</v-icon>
        <span class="body-2 success--text">Your server is up to date</span>
      </span>
      <span v-else class="warning--text">
        <v-icon size="medium" color="warning">mdi-alert</v-icon>
        <span class="body-2 warning--text">There's a newer version available!</span>
      </span>
    </template>
    <v-card-text>
      <div class="d-flex justify-space-between pl-4 pr-4">
        <div>
          <h4 class="primary--text text--lighten-2">
            Current
          </h4>
          <p class="primary--text text-h4 text-sm-h2">
            {{ versionInfo.current }}
          </p>
        </div>
        <v-icon color="primary lighten-1">mdi-arrow-right</v-icon>
        <div>
          <h4 class="primary--text text--lighten-2">Latest</h4>
          <p class="primary--text text-h4 text-sm-h2">
            {{ versionInfo.latest }}
          </p>
        </div>
      </div>
      <v-btn v-if="!isLatestVersion" color="primary" width="100%">
        Follow our guide on how to update your server
      </v-btn>
    </v-card-text>
  </admin-card>
</template>

<script>
import AdminCard from "@/components/admin/AdminCard";

export default {
  name: "VersionInfoCard",
  components: { AdminCard },
  data() {
    return {
      versionInfo: {
        current: "2.1.18",
        latest: "2.1.18"
      }
    };
  },
  computed: {
    isLatestVersion() {
      return this.versionInfo.current == this.versionInfo.latest;
    }
  }
};
</script>

<style scoped>

</style>
