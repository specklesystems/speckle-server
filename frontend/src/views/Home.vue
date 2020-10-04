<template>
  <div v-if="recentActivity">
    <v-card class="mb-5" elevation="0" rounded="lg">
      <v-subheader class="text-uppercase">Recent activity:</v-subheader>
      <v-chip-group
        v-model="selectedActivity"
        mandatory
        active-class="blue--text text--accent-1"
      >
        <v-chip class="ml-3 mb-3" small>all activity</v-chip>
        <v-chip class="mb-3" small>streams</v-chip>
        <v-chip class="mb-3" small>commits</v-chip>
      </v-chip-group>
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
            <code>{{ activity.id }}</code>
          </v-col>
          <v-spacer></v-spacer>
          <v-col class="text-right">
            <timeago :datetime="parseInt(activity.createdAt)"></timeago>
          </v-col>
        </v-row>
        <v-divider></v-divider>
        <v-row align="end">
          <v-col class="pt-0 pb-0">
            <v-card-title class="subtitle-2">
              {{ activity.name }}
            </v-card-title>
            <v-card-subtitle>
              {{ activity.description }}
            </v-card-subtitle>
          </v-col>
          <v-spacer></v-spacer>
          <v-col class="mr-4 text-right">
            <span class="caption">{{ activity.branches.totalCount }}</span>
            <v-icon small>mdi-source-branch</v-icon>
            <span class="ma-2"></span>
            <span class="caption">{{ activity.commits.totalCount }}</span>
            <v-icon small>mdi-cube-outline</v-icon>
            <span class="ma-2"></span>
            <span class="caption">{{ activity.collaborators.length }}</span>
            <v-icon small>mdi-account-outline</v-icon>
            <span class="ma-2"></span>
            <v-icon v-if="activity.isPublic" small>mdi-lock-open</v-icon>
            <v-icon v-else small>mdi-lock-outline</v-icon>
          </v-col>
        </v-row>
      </div>

      <!-- COMMIT -->
      <div v-if="activity.__typename === 'CommitCollectionUserNode'">
        <v-row class="caption pl-4 pr-4 grey--text text--lighten-1">
          <v-col>
            <v-icon small color="grey lighten-1">mdi-cube-outline</v-icon>
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
        <v-card-title v-if="!activity.items" class="subtitle-2">
          {{ activity.message }}
        </v-card-title>
        <v-expansion-panels v-else flat>
          <v-expansion-panel>
            <v-expansion-panel-header class="pl-4">
              <span class="subtitle-2">
                {{ activity.message }}
              </span>
            </v-expansion-panel-header>
            <v-expansion-panel-content>
              <v-list dense>
                <v-list-item v-for="(item, i) in activity.items" :key="i">
                  <div style="width: 100%">
                    <v-row class="caption">
                      <v-col>
                        <span class="caption">{{ item.message }}</span>
                      </v-col>
                      <v-spacer></v-spacer>
                      <v-col class="text-right">
                        <timeago :datetime="parseInt(item.createdAt)"></timeago>
                      </v-col>
                    </v-row>
                    <v-divider v-if="i < activity.items.length - 1"></v-divider>
                  </div>
                </v-list-item>
              </v-list>
            </v-expansion-panel-content>
          </v-expansion-panel>
        </v-expansion-panels>
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
  data: () => ({ selectedActivity: 0 }),
  computed: {
    recentActivity() {
      let activity = []
      let activityGrouped = []

      if (
        this.user.streams &&
        this.user.streams.items &&
        this.selectedActivity != 2
      ) {
        activity.push(...this.user.streams.items)
      }

      if (
        this.user.commits &&
        this.user.commits.items &&
        this.selectedActivity != 1
      ) {
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

        // last item
        if (i == activity.length - 1) {
          if (group.length > 1) {
            activityGrouped.push({
              streamName: group[0].streamName,
              createdAt: group[0].createdAt,
              message: group[0].message,
              __typename: "CommitCollectionUserNode",
              items: group
            })
          } else activityGrouped.push(...group)
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
