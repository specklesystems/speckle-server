<template>
  <div>
    <user-stream-invite-banners @invite-used="onInviteUsed" />
    <v-row dense>
      <v-col v-if="isApolloLoading && !timeline">
        <div class="my-5">
          <v-timeline align-top dense>
            <v-timeline-item v-for="i in 6" :key="i" medium>
              <v-skeleton-loader type="article"></v-skeleton-loader>
            </v-timeline-item>
          </v-timeline>
        </div>
      </v-col>

      <v-col
        v-else-if="timeline && timeline.items.length > 0"
        cols="12"
        :style="`${$vuetify.breakpoint.xsOnly ? 'margin-left: -20px;' : ''}`"
      >
        <div>
          <div v-if="timeline" key="activity-list">
            <v-timeline align-top dense class="pt-0">
              <list-item-activity
                v-for="activity in groupedTimeline"
                :key="activity.time"
                :activity="activity"
                :activity-group="activity"
                class="my-1"
              ></list-item-activity>
              <infinite-loading
                v-if="timeline && timeline.items.length < timeline.totalCount"
                @infinite="infiniteHandler"
              >
                <div slot="no-more">This is all your activity!</div>
                <div slot="no-results">There are no ctivities to load</div>
              </infinite-loading>
            </v-timeline>
          </div>
        </div>
      </v-col>
      <v-col v-else cols="12">
        <no-data-placeholder v-if="quickUser">
          <h2>Welcome {{ quickUser.name.split(' ')[0] }}!</h2>
          <p class="caption">
            Once you {{ isGuestUser ? 'join' : 'create' }} a stream and start sending
            some data, your activity will show up here.
          </p>

          <template #actions>
            <v-list rounded class="transparent">
              <v-list-item
                v-if="!isGuestUser"
                link
                class="primary mb-4"
                dark
                @click="$eventHub.$emit('show-new-stream-dialog')"
              >
                <v-list-item-icon>
                  <v-icon>mdi-plus-box</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                  <v-list-item-title>Create a new stream!</v-list-item-title>
                  <v-list-item-subtitle class="caption">
                    Streams are like folders, or data repositories.
                  </v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
            </v-list>
          </template>
        </no-data-placeholder>
      </v-col>
    </v-row>
  </div>
</template>

<script>
import { gql } from '@apollo/client/core'
import UserStreamInviteBanners from '@/main/components/stream/UserStreamInviteBanners.vue'
import InfiniteLoading from 'vue-infinite-loading'
import NoDataPlaceholder from '@/main/components/common/NoDataPlaceholder.vue'
import ListItemActivity from '@/main/components/activity/ListItemActivity.vue'
import { UserTimelineDocument } from '@/graphql/generated/graphql'
import { useQuery } from '@vue/apollo-composable'
import { computed } from 'vue'
import { AppLocalStorage } from '@/utils/localStorage'
import { SKIPPABLE_ACTION_TYPES } from '@/main/lib/feed/helpers/activityStream'
import { isGuest } from '@/main/lib/core/helpers/users'

export default {
  name: 'FeedTimeline',
  components: {
    InfiniteLoading,
    ListItemActivity,
    NoDataPlaceholder,
    UserStreamInviteBanners
  },
  setup() {
    // Timeline query
    const {
      result: timelineResult,
      fetchMore: timelineFetchMore,
      refetch: timelineRefetch,
      loading: timelineLoading
    } = useQuery(
      UserTimelineDocument,
      {
        cursor: null
      },
      { fetchPolicy: 'cache-and-network' }
    )
    const timeline = computed(() => {
      return timelineResult.value?.activeUser?.timeline || null
    })
    const groupedTimeline = computed(() => {
      const data = timelineResult.value
      if (!data) return []

      const skippableActionTypes = SKIPPABLE_ACTION_TYPES
      const groupedTimeline = data.activeUser.timeline.items.reduce(function (
        prev,
        curr
      ) {
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

        if (skippableActionTypes.includes(curr.actionType)) {
          action = 'skip'
        }

        if (curr.actionType === test.actionType && curr.streamId === test.streamId) {
          if (
            curr.actionType.includes('stream_permissions') ||
            curr.actionType.includes('comment_')
          ) {
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
            curr.actionType === 'commit_create' ||
            curr.actionType === 'commit_received'
          )
            action = 'combine'
        }

        if (action === 'combine') {
          prev[prev.length - 1].push(curr)
        } else if (action === 'split') {
          prev.push([curr])
        }
        return prev
      },
      [])

      return groupedTimeline
    })

    // Quick user info
    const { result: quickUserResult, loading: quickUserLoading } = useQuery(gql`
      query {
        quickUser: activeUser {
          id
          name
          role
        }
      }
    `)
    const quickUser = computed(() => quickUserResult.value?.quickUser || null)
    const isGuestUser = computed(() => isGuest(quickUser.value))

    return {
      isGuestUser,
      quickUser,
      groupedTimeline,
      timeline,
      timelineFetchMore,
      timelineRefetch,
      quickUserLoading,
      timelineLoading
    }
  },
  data() {
    return {
      newStreamDialog: 0,
      activityNav: true
    }
  },
  computed: {
    isApolloLoading() {
      return this.$apollo.loading || this.quickUserLoading || this.timelineLoading
    }
  },
  watch: {
    timeline(val) {
      if (val.totalCount === 0 && !AppLocalStorage.get('onboarding')) {
        this.$router.push('/onboarding')
      }
    }
  },
  mounted() {
    setTimeout(
      function () {
        this.activityNav = !this.$vuetify.breakpoint.smAndDown
      }.bind(this),
      10
    )
  },
  methods: {
    onInviteUsed() {
      // Refetch feed
      this.timelineRefetch()
    },

    async infiniteHandler($state) {
      const result = await this.timelineFetchMore({
        variables: {
          cursor: this.timeline.cursor
        }
      })

      const newItems = result.data?.activeUser?.timeline?.items || []
      if (!newItems.length) {
        $state.complete()
      } else {
        $state.loaded()
      }
    }
  }
}
</script>
