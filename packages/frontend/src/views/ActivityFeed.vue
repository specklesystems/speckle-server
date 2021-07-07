<template>
  <div>
    <v-card elevation="0" class="my-5" flat>
      <v-card-actions class="body-1">
        <v-select v-model="activityFilter.type" :items="filterTypes" label="Standard" hide-details dense></v-select>
        <v-menu
          ref="menub"
          v-model="menu2"
          :close-on-content-click="false"
          :return-value.sync="activityFilter.after"
          transition="scale-transition"
          offset-y
          min-width="auto"
        >
          <template v-slot:activator="{ on, attrs }">
            <v-text-field
              v-model="activityFilter.after"
              label="After date"
              prepend-icon="mdi-calendar"
              readonly
              v-bind="attrs"
              v-on="on"
              hide-details
              dense
            ></v-text-field>
          </template>
          <v-date-picker
            v-model="activityFilter.after"
            no-title
            @cancel="activityFilter.after = null"
          >
            <v-spacer></v-spacer>
            <v-btn
              text
              @click="menu2 = false"
            >
              Cancel
            </v-btn>
            <v-btn
              text
              @click="$refs.menub.save(activityFilter.after)"
            >
              OK
            </v-btn>
          </v-date-picker>
        </v-menu>
        <v-menu
          ref="menu"
          v-model="menu"
          :close-on-content-click="false"
          :return-value.sync="activityFilter.before"
          transition="scale-transition"
          offset-y
          min-width="auto"
        >
          <template v-slot:activator="{ on, attrs }">
            <v-text-field
              v-model="activityFilter.before"
              label="Before date"
              prepend-icon="mdi-calendar"
              readonly
              v-bind="attrs"
              v-on="on"
              hide-details
              dense
            ></v-text-field>
          </template>
          <v-date-picker
            v-model="activityFilter.before"
            no-title
            @cancel="activityFilter.before = null"
          >
            <v-spacer></v-spacer>
            <v-btn
              text
              @click="menu = false"
            >
              Cancel
            </v-btn>
            <v-btn
              text
              @click="$refs.menu.save(activityFilter.before)"
            >
              OK
            </v-btn>
          </v-date-picker>
        </v-menu>
      </v-card-actions>
    </v-card>
    <v-fade-transition mode="out-in" @after-enter="showContent = true">
      <div key="activity-loading" v-if="$apollo.queries.activityFeed.loading || !this.load" class="d-flex flex-column justify-center align-center grey--text pa-12">
        <div>Loading....</div>
        <v-progress-linear indeterminate color="grey lighten-2"></v-progress-linear>
      </div>
      <div key="activity-empty" v-else-if="$apollo.queries.activityFeed.error" class="d-flex justify-center align-center grey--text pa-12">
        <span>
          Error
        </span>
      </div>
      <div key="activity-empty" v-else-if="activityFeed.items.length == 0" class="d-flex justify-center align-center grey--text pa-12">
        <span>
          No activity found...
        </span>
      </div>
      <div key="activity-list" v-else>
        <v-slide-x-reverse-transition group>
          <activity-item v-show="showContent" v-for="activity in activityFeed.items" :activity="activity" class="my-1" :key="activity.time"></activity-item>
        </v-slide-x-reverse-transition>
      </div>
    </v-fade-transition>
  </div>
</template>

<script>
import ActivityItem from "@/components/ActivityItem";
import gql from "graphql-tag";

export default {
  name: "ActivityFeed",
  components: { ActivityItem },
  props: {
    type: String
  },
  mounted() {
    this.delayLoad()
  },
  data() {
    return {
      filterTypes: ["branch_create", "branch_delete", "stream_create", "stream_delete", "commit_create", "commit_delete"],
      activityFilter: {
        type: null,
        before: null,
        after: null
      },
      menu: false,
      menu2: false,
      load: false,
      showContent: false
    };
  },
  apollo: {
    activityFeed: {
      query: gql`query($type: String, $before: DateTime, $after: DateTime) {
        user {
          id
          activity(actionType: $type, before: $before, after: $after,limit: 10) {
            totalCount
            cursor
            items {
              actionType
              userId
              streamId
              resourceId
              resourceType
              time
              info
            }
          }
        }
      }`,
      variables() {
        var obj = {
          type: this.activityFilter.type,
          before: this.activityFilter.before ? new Date(this.activityFilter.before).toISOString() : undefined,
          after: this.activityFilter.after ? new Date(this.activityFilter.after).toISOString() : undefined
        };
        console.log('grahpql vars', obj)
        return obj
      },
      update: data => {
        console.log("activity fetched", data);
        return data.user.activity;
      }
    }
  },
  methods: {
    delayLoad(){
      this.load = false;
      setTimeout(()=> { this.load = true }, 500)
    }
  },
  watch: {
    activityFilter: {
      deep: true,
      handler(filter) {
        if(!this.activityFilter) return;
        console.log("filterChanged", filter);
        this.$apollo.queries.activityFeed.refetch();
      }
    }
  }
};
</script>

<style scoped>

</style>
