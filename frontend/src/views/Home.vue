<template>
  <div v-if="recentActivity">
    <v-card class="mb-5" elevation="0" rounded="lg">
      <v-subheader class="text-uppercase">Recent activity:</v-subheader>
      <v-chip class="ml-3 mb-3" small color="indigo" text-color="white">
        all activity
      </v-chip>
      <v-chip class="ml-3 mb-3" small color="orange" text-color="white">
        streams
      </v-chip>
      <v-chip class="ml-3 mb-3" small color="green" text-color="white">
        commits
      </v-chip>
    </v-card>
    <v-card
      v-for="(activity, i) in recentActivity"
      :key="i"
      class="mb-2"
      elevation="0"
      rounded="lg"
    >
      <!-- STREAM -->
      <div v-if="activity.__typename === 'Stream'">
        <v-row class="caption pl-4 pr-4 grey--text text--lighten-1">
          <v-col>
            <v-icon small color="grey lighten-1">mdi-compare-vertical</v-icon>
            &nbsp;
            <strong>You</strong>
            created a new stream
          </v-col>
          <v-spacer></v-spacer>
          <v-col class="text-right">
            <timeago :datetime="parseInt(activity.createdAt)"></timeago>
          </v-col>
        </v-row>
        <v-divider></v-divider>
        <v-card-title class="subtitle-2">
          {{ activity.name }}
        </v-card-title>
        <v-card-subtitle>
          {{ activity.description }}
        </v-card-subtitle>
      </div>

      <!-- COMMIT -->
      <div v-if="activity.__typename === 'CommitCollectionUserNode'">
        <v-row class="caption pl-4 pr-4 grey--text text--lighten-1">
          <v-col>
            <v-icon small color="grey lighten-1">mdi-cube</v-icon>
            &nbsp;
            <strong>You</strong>
            pushed
            <span v-if="activity.items">
              {{ activity.items.length }} commits
            </span>
            <span v-else>a commit</span>
            to
            <strong>{{ activity.streamName }}</strong>
          </v-col>
          <v-spacer></v-spacer>
          <v-col class="text-right">
            <timeago :datetime="parseInt(activity.createdAt)"></timeago>
          </v-col>
        </v-row>

        <v-divider></v-divider>
        <v-card-title class="subtitle-2">
          {{ activity.message }}
        </v-card-title>
      </div>
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
  data: () => ({}),
  computed: {
    recentActivity() {
      let activity = []
      let activityGrouped = []

      if (this.user.streams && this.user.streams.items) {
        activity.push(...this.user.streams.items)
      }

      if (this.user.commits && this.user.commits.items) {
        activity.push(...this.user.commits.items)
      }
      activity.sort(this.compareUpdates)

      let group = []
      for (let i = 0; i < activity.length; i++) {
        //first item
        if (i === 0) {
          group.push(activity[i])
          continue
        }

        if (
          group[0].__typename === "CommitCollectionUserNode" &&
          group[0].streamId === activity[i].streamId
        ) {
          group.push(activity[i])
        } else {
          if (group.length > 1) {
            activityGrouped.push({
              streamName: group[0].streamName,
              createdAt: group[0].createdAt,
              message: group[0].message,
              __typename: "CommitCollectionUserNode",
              items: group
            })
          } else activityGrouped.push(...group)
          group = []
          group.push(activity[i])
        }
      }

      return activityGrouped
    }
  },
  methods: {
    compareUpdates(a, b) {
      if (a.createdAt < b.createdAt) {
        return 1
      }
      if (a.createdAt > b.createdAt) {
        return -1
      }
      return 0
    }
  }
}
</script>
