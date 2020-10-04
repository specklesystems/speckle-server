<template>
  <div v-if="user.streams && user.streams.items">
    <v-card
      v-for="(stream, i) in user.streams.items"
      :key="i"
      class="mb-2"
      elevation="0"
      rounded="lg"
    >
      <v-row>
        <div class="ml-4">
          <v-card-title class="subtitle-2">
            {{ stream.name }}
          </v-card-title>
          <v-card-subtitle>
            {{ stream.description }}
          </v-card-subtitle>
        </div>
      </v-row>
      <v-row>
        <v-col class="ml-4 text-left caption">
          <v-icon small>mdi-clock-outline</v-icon>
          <timeago :datetime="parseInt(stream.createdAt)" />
          <span class="ma-2"></span>
          <v-icon small>mdi-pencil-outline</v-icon>
          <timeago :datetime="parseInt(stream.updatedAt)" />
        </v-col>
        <v-spacer></v-spacer>
        <v-col class="mr-4 text-right caption" align="end">
          <span>{{ stream.branches.totalCount }}</span>
          <v-icon small>mdi-source-branch</v-icon>
          <span class="ma-2"></span>
          <span>{{ stream.commits.totalCount }}</span>
          <v-icon small>mdi-cube-outline</v-icon>
          <span class="ma-2"></span>
          <span>{{ stream.collaborators.length }}</span>
          <v-icon small>mdi-account-outline</v-icon>
          <span class="ma-2"></span>
          <v-icon v-if="stream.isPublic" small>mdi-lock-open</v-icon>
          <v-icon v-else small>mdi-lock-outline</v-icon>
        </v-col>
      </v-row>
    </v-card>
  </div>
</template>
<script>
// @ is an alias to /src
//import gql from "graphql-tag"

export default {
  name: "Streams",
  props: {
    user: {
      type: Object,
      default: function () {
        return {}
      }
    }
  },
  data: () => ({})
}
</script>
