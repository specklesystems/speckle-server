<template>
  <v-card class="mb-2" elevation="0" rounded="lg">
    <v-row class="caption pl-4 pr-4">
      <v-col>
        <v-icon small color="grey lighten-1">mdi-compare-vertical</v-icon>
        &nbsp;
        <strong>You</strong>
        created a new stream &nbsp;
        <timeago :datetime="parseInt(stream.createdAt)"></timeago>
      </v-col>
      <v-spacer></v-spacer>
      <v-col class="mr-4 text-right">
        <span class="caption streamid">
          {{ stream.id }}
        </span>
        <v-icon small>mdi-key-outline</v-icon>
        <span class="ma-2"></span>
        <span class="caption">{{ stream.branches.totalCount }}</span>
        <v-icon small>mdi-source-branch</v-icon>
        <span class="ma-2"></span>
        <span class="caption">{{ stream.commits.totalCount }}</span>
        <v-icon small>mdi-cube-outline</v-icon>
        <span class="ma-2"></span>
        <span class="caption">{{ stream.collaborators.length }}</span>
        <v-icon small>mdi-account-outline</v-icon>
        <span class="ma-2"></span>
        <v-icon v-if="stream.isPublic" small>mdi-lock-open</v-icon>
        <v-icon v-else small>mdi-lock-outline</v-icon>
      </v-col>
    </v-row>
    <v-divider></v-divider>
    <v-row align="end">
      <v-col class="pt-0 pb-0">
        <v-card-title class="subtitle-2">
          {{ stream.name }}
        </v-card-title>
        <v-card-subtitle>
          {{ stream.description }}
        </v-card-subtitle>
      </v-col>
    </v-row>
  </v-card>
</template>
<script>
export default {
  props: {
    stream: {
      type: Object,
      default: function () {
        return {}
      }
    }
  }
}
</script>
