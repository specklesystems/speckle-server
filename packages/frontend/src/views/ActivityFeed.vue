<template>
  <div>
    <v-card elevation="0" class="my-5" flat>
      <v-card-text class="pb-0">
        <span>Filter activity feed</span>
        <div class="d-flex">
          <v-select
            v-model="activityFilter.type"
            :items="filterSelect"
            item-text="name"
            item-value="type"
            label="Activity type"
            dense
            clearable
          ></v-select>
          <v-menu
            ref="menub"
            v-model="menu2"
            :close-on-content-click="true"
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
                dense
                clearable
              ></v-text-field>
            </template>
            <v-date-picker v-model="activityFilter.after" no-title color="primary"></v-date-picker>
          </v-menu>
          <v-menu
            ref="menu"
            v-model="menu"
            :close-on-content-click="true"
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
                dense
                clearable
              ></v-text-field>
            </template>
            <v-date-picker
              v-model="activityFilter.before"
              no-title
              @cancel="activityFilter.before = null"
              color="primary"
            ></v-date-picker>
          </v-menu>
        </div>
      </v-card-text>
    </v-card>
    <div key="activity-list" v-if="activityFeed">
      <activity-item
        v-for="activity in activityFeed.items"
        :activity="activity"
        :key="activity.time"
        class="my-1"
      ></activity-item>
      <infinite-loading @infinite="infiniteHandler" key="infiniteLoader">
        <div slot="no-more" class="pa-6 grey--text">No more activity results!</div>
        <div slot="no-results" class="pa-12 grey--text">There are no streams to load</div>
      </infinite-loading>
    </div>
  </div>
</template>

<script>
import ActivityItem from '@/components/ActivityItem'
import gql from 'graphql-tag'
import InfiniteLoading from 'vue-infinite-loading'

export default {
  name: 'ActivityFeed',
  components: { ActivityItem, InfiniteLoading },
  props: {
    type: String
  },
  mounted() {},
  data() {
    return {
      filterTypes: [
        'branch_create',
        'branch_delete',
        'branch_update',
        'stream_create',
        'stream_delete',
        'stream_update',
        'stream_permissions_add',
        'stream_permissions_remove',
        'commit_create',
        'commit_delete',
        'commit_udpate',
        'user_update',
        'user_create',
        'user_delete'
      ],
      activityFilter: {
        type: null,
        before: null,
        after: null
      },
      menu: false,
      menu2: false,
      load: false,
      showContent: false
    }
  },
  apollo: {
    activityFeed: {
      query: gql`
        query($type: String, $before: DateTime, $after: DateTime) {
          user {
            id
            activity(actionType: $type, before: $before, after: $after) {
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
        }
      `,
      variables() {
        var obj = {
          type: this.activityFilter.type,
          before: this.activityFilter.before
            ? new Date(this.activityFilter.before).toISOString()
            : undefined,
          after: this.activityFilter.after
            ? new Date(this.activityFilter.after).toISOString()
            : undefined
        }
        return obj
      },
      update: (data) => {
        return data.user.activity
      }
    }
  },
  computed: {
    filterSelect() {
      return this.filterTypes.map((t) => {
        var split = t.split('_')
        var name = `${split[0]} ${split[1]}`
        return {
          type: t,
          name: name
        }
      })
    }
  },
  methods: {
    infiniteHandler($state) {
      if (!this.activityFeed.cursor) {
        $state.loaded()
        $state.complete()
        return
      }
      this.$apollo.queries.activityFeed.fetchMore({
        variables: {
          before: this.activityFeed.cursor,
          after: this.activityFilter.after
            ? new Date(this.activityFilter.after).toISOString()
            : undefined
        },
        // Transform the previous result with new data
        updateQuery: (previousResult, { fetchMoreResult }) => {
          const newItems = fetchMoreResult.user.activity.items
          console.warn('new items', newItems)
          //$state.complete()
          //set vue-infinite state
          if (newItems.length === 0) $state.complete()
          else $state.loaded()

          return {
            user: {
              id: previousResult.user.id,
              __typename: previousResult.user.__typename,
              activity: {
                __typename: previousResult.user.activity.__typename,
                totalCount: fetchMoreResult.user.activity.totalCount,
                cursor: fetchMoreResult.user.activity.cursor,
                // Merging the new streams
                items: [...previousResult.user.activity.items, ...newItems]
              }
            }
          }
        }
      })
    }
  }
}
</script>

<style scoped></style>
