<template>
  <v-card :class="`${!$vuetify.theme.dark ? 'grey lighten-5' : ''} mt-`">
    <v-toolbar flat>
      <v-toolbar-title>General Info</v-toolbar-title>
    </v-toolbar>
    <v-row class="d-flex justify-space-around mt-4">
      <v-col cols="6" sm="6" md="3" v-for="(value, name) in serverStats" :key="name" class="flex-grow-1">
        <h4 class="primary--text text--lighten-2 text-center">Total {{ name }}</h4>
        <v-tooltip bottom color="primary" :disabled="value < 1000">
          <template v-slot:activator="{ on, attrs }">
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
  </v-card>
</template>

<script>
import AnimatedNumber from '@/components/AnimatedNumber'
import gql from 'graphql-tag'

export default {
  name: 'GeneralInfoCard',
  components: { AnimatedNumber },
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
        var stats = data.serverStats
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
