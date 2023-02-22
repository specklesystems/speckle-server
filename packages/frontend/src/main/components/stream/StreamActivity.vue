<template>
  <v-row>
    <v-col cols="12">
      <v-timeline
        v-if="stream && groupedActivity && groupedActivity.length !== 0"
        align-top
        dense
      >
        <list-item-activity
          v-for="activity in groupedActivity"
          :key="activity.time"
          :activity="activity"
          :activity-group="activity"
          class="my-1"
        ></list-item-activity>
        <infinite-loading
          v-if="
            stream.activity && stream.activity.items.length < stream.activity.totalCount
          "
          @infinite="infiniteHandler"
        >
          <div slot="no-more">This is all your activity!</div>
          <div slot="no-results">There are no activities to load</div>
        </infinite-loading>
      </v-timeline>
      <v-timeline v-else-if="isApolloLoading" align-top dense>
        <v-timeline-item v-for="i in 6" :key="i" medium>
          <v-skeleton-loader type="article"></v-skeleton-loader>
        </v-timeline-item>
      </v-timeline>
      <div v-if="groupedActivity && groupedActivity.length === 0">
        <v-card class="transparent elevation-0 mt-10">
          <v-card-text>Nothing to show 🍃</v-card-text>
        </v-card>
      </div>
    </v-col>
  </v-row>
</template>
<script>
import { StreamWithActivityDocument } from '@/graphql/generated/graphql'
import { useQuery } from '@vue/apollo-composable'
import { useRoute } from '@/main/lib/core/composables/router'
import { computed } from 'vue'
import { SKIPPABLE_ACTION_TYPES } from '@/main/lib/feed/helpers/activityStream'

export default {
  name: 'StreamActivity',
  components: {
    ListItemActivity: () => import('@/main/components/activity/ListItemActivity'),
    InfiniteLoading: () => import('vue-infinite-loading')
  },
  setup() {
    // Stream activity query & derived computeds
    const route = useRoute()
    const {
      result,
      fetchMore: activityFetchMore,
      loading: activityLoading
    } = useQuery(StreamWithActivityDocument, () => ({
      id: route.params.streamId,
      cursor: null
    }))
    const stream = computed(() => result.value?.stream || null)

    const skippableActionTypes = SKIPPABLE_ACTION_TYPES
    const groupedActivity = computed(() =>
      (stream.value?.activity?.items || []).reduce(function (prev, curr) {
        if (skippableActionTypes.includes(curr.actionType)) {
          return prev
        }

        //first item
        if (!prev.length) {
          prev.push([curr])
          return prev
        }
        const test = prev[prev.length - 1][0]
        let action = 'split' // split | combine | skip
        if (curr.actionType === test.actionType && curr.streamId === test.streamId) {
          if (curr.actionType.includes('stream_permissions')) {
            //skip multiple stream_permission actions on the same user, just pick the last!
            if (
              prev[prev.length - 1].some(
                (x) => x.info.targetUser === curr.info.targetUser
              )
            )
              action = 'skip'
            else action = 'combine'
          } //stream, branch, commit
          else if (
            curr.actionType.includes('_update') ||
            curr.actionType === 'commit_create'
          )
            action = 'combine'
        }
        if (action === 'combine') {
          prev[prev.length - 1].push(curr)
        } else if (action === 'split') {
          prev.push([curr])
        }
        return prev
      }, [])
    )

    return {
      stream,
      groupedActivity,
      activityFetchMore,
      activityLoading
    }
  },
  computed: {
    isApolloLoading() {
      return this.$apollo.loading || this.activityLoading
    }
  },
  methods: {
    async infiniteHandler($state) {
      const result = await this.activityFetchMore({
        variables: {
          id: this.$route.params.streamId,
          cursor: this.stream.activity.cursor
        }
      })

      const newItems = result.data?.stream?.activity?.items
      if (!newItems.length) {
        $state.complete()
      } else {
        $state.loaded()
      }
    }
  }
}
</script>
