<template>
  <div v-if="user.streams && user.streams.items">
    <v-card class="mb-5" elevation="0" rounded="lg">
      <v-subheader class="text-uppercase"> Recent activity: </v-subheader>
      <v-chip class="ml-3 mb-3" small color="indigo" text-color="white">
        all activity
      </v-chip>
      <v-chip class="ml-3 mb-3" small color="orange" text-color="white">
        your activity
      </v-chip>
      <v-chip class="ml-3 mb-3" small color="green" text-color="white">
        team activity
      </v-chip>
    </v-card>

    <v-card
      v-for="(stream, i) in user.streams.items"
      :key="i"
      class="mb-2"
      elevation="0"
      rounded="lg"
    >
      <v-row class="caption pl-4 pr-4 grey--text text--lighten-1">
        <v-col><strong>You</strong> created a new stream</v-col>
        <v-spacer />

        <v-col class="text-right">
          <timeago :datetime="parseInt(stream.createdAt)" />
        </v-col>
      </v-row>
      <v-divider />
      <v-card-title>
        {{ stream.name }}
      </v-card-title>
      <v-card-subtitle>
        {{ stream.description }}
      </v-card-subtitle>
    </v-card>
  </div>
</template>
<script>
// @ is an alias to /src
//import gql from "graphql-tag"

export default {
  name: "Home",
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
