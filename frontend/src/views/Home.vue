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
    <div v-for="(activity, i) in recentActivity" :key="i">
      <stream-box
        v-if="activity.__typename === 'Stream'"
        :stream="activity"
        :is-feed="true"
      ></stream-box>
      <commit-box
        v-else-if="activity.__typename === 'CommitCollectionUserNode'"
        :commit="activity"
      ></commit-box>
    </div>
  </div>
</template>
<script>
import StreamBox from "../components/StreamBox"
import CommitBox from "../components/CommitBox"

export default {
  name: "Home",
  components: { StreamBox, CommitBox },
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
              streamId: group[0].streamId,
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
              streamId: group[0].streamId,
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
<style>
.streamid {
  font-family: monospace !important;
}

a {
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}
</style>
