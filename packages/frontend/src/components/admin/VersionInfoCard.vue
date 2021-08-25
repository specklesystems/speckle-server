<template>
  <v-card :class="`${!$vuetify.theme.dark ? 'grey lighten-5' : ''} mt-10`">
    <v-toolbar flat>
      <v-toolbar-title>Version Info</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon href="https://github.com/specklesystems/speckle-server/releases" target="_blank">
        <span v-if="isLatestVersion" class="text--h6 success--text">
          <v-icon size="medium" color="success" v-tooltip="'Up to date.'">mdi-check-bold</v-icon>
        </span>
        <span v-else class="warning--text">
          <v-icon size="medium" color="warning" v-tooltip="'There is a newer version available!'">
            mdi-alert
          </v-icon>
        </span>
      </v-btn>
    </v-toolbar>
    <div class="d-flex justify-space-around pl-4 pr-4 mt-4">
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
  </v-card>
</template>

<script>
import gql from 'graphql-tag'

export default {
  name: 'VersionInfoCard',
  components: { },
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
