<template>
  <section-card expandable>
    <template #header>General Info</template>
    <v-row class="d-flex justify-space-around mt-4">
      <v-col
        v-for="(value, name) in serverStats"
        :key="name"
        cols="6"
        sm="6"
        md="3"
        class="flex-grow-1"
      >
        <h4 class="primary--text text--lighten-2 text-center">Total {{ name }}</h4>
        <v-tooltip bottom color="primary" :disabled="value < 1000">
          <template #activator="{ on, attrs }">
            <p
              class="primary--text text-h3 text-md-h2 text-lg-h1 text-center"
              v-bind="attrs"
              v-on="on"
            >
              <animated-number :value="value" class="speckle-gradient-txt" />
            </p>
          </template>
          <span>{{ value }}</span>
        </v-tooltip>
      </v-col>
    </v-row>
  </section-card>
</template>

<script>
import { gql } from '@apollo/client/core'

export default {
  name: 'GeneralInfoCard',
  components: {
    AnimatedNumber: () => import('@/main/components/admin/AnimatedNumber'),
    SectionCard: () => import('@/main/components/common/SectionCard')
  },
  apollo: {
    serverStats: {
      query: gql`
        query {
          serverStats {
            totalObjectCount
            totalCommitCount
            totalStreamCount
            totalUserCount
          }
        }
      `,
      update(data) {
        const stats = data.serverStats
        return {
          users: stats.totalUserCount,
          streams: stats.totalStreamCount,
          commits: stats.totalCommitCount,
          objects: stats.totalObjectCount
        }
      }
    }
  }
}
</script>

<style scoped lang="scss"></style>
