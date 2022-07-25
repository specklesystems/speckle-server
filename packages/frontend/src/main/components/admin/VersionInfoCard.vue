<template>
  <section-card expandable>
    <template #header>Server Version Info</template>
    <template #actions>
      <v-spacer />
      <v-btn
        :color="`${isLatestVersion ? 'success' : 'warning'}`"
        dark
        href="https://github.com/specklesystems/speckle-server/releases"
        target="_blank"
      >
        <span v-if="isLatestVersion">
          <v-icon size="medium" class="mb-1">mdi-check-bold</v-icon>
          Up to date
        </span>
        <span v-else>
          <v-icon size="medium" class="mb-1">mdi-alert</v-icon>
          Update available
        </span>
      </v-btn>
    </template>
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
  </section-card>
</template>

<script>
import { gql } from '@apollo/client/core'

export default {
  name: 'VersionInfoCard',
  components: { SectionCard: () => import('@/main/components/common/SectionCard') },
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
      return fetch(
        'https://api.github.com/repos/specklesystems/speckle-server/releases/latest'
      )
        .then(async (res) => {
          const x = await res.json()
          return x.tag_name
        })
        .catch((err) => {
          // console.error('error fetch', err)
          this.$eventHub.$emit('notification', {
            text: err.message
          })
        })
    }
  }
}
</script>

<style scoped></style>
