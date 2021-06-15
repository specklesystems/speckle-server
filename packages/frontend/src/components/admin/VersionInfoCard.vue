<template>
  <admin-card title="Version Info" v-bind="$attrs">
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
    <div class="d-flex justify-space-around pl-4 pr-4">
      <div>
        <h4 class="primary--text text--lighten-2">Current</h4>
        <p class="primary--text text-h4 text-sm-h2 speckle-gradient-txt">
          {{ versionInfo.current }}
        </p>
      </div>
      <v-icon color="primary lighten-1">mdi-arrow-right</v-icon>
      <div>
        <h4 class="primary--text text--lighten-2">Latest</h4>
        <p class="primary--text text-h4 text-sm-h2 speckle-gradient-txt">
          {{ versionInfo.latest }}
        </p>
      </div>
    </div>
    <v-btn disabled v-if="!isLatestVersion" color="primary" width="100%">
      Follow our guide on how to update your server
    </v-btn>
  </admin-card>
</template>

<script>
import AdminCard from '@/components/admin/AdminCard'
import gql from 'graphql-tag'

export default {
  name: 'VersionInfoCard',
  components: { AdminCard },
  data() {
    return {
      versionInfo: {
        current: '2.0.18',
        latest: '2.0.27'
      }
    }
  },
  apollo: {
    currentVersion: {
      query: gql`
        query {
          serverInfo {
            version
          }
        }
      `,
      update(data) {
        this.versionInfo.current = data.serverInfo.version
      }
    }
  },
  computed: {
    isLatestVersion() {
      return this.versionInfo.current === this.versionInfo.latest
    }
  },
  async mounted() {
    this.versionInfo.latest = await this.getLatestVersion()
  },
  methods: {
    getLatestVersion() {
      return fetch('https://api.github.com/repos/specklesystems/speckle-server/releases/latest')
        .then(async (res) => {
          var x = await res.json()
          return x.tag_name.split('v')[1]
        })
        .catch((err) => console.error('error fetch', err))
    }
  }
}
</script>

<style scoped></style>
