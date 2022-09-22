<template>
  <div>
    <!-- Toolbar -->
    <prioritized-portal to="toolbar" identity="commits" :priority="0">
      <div class="font-weight-bold">
        Your Latest Commits
        <span v-if="user" class="caption">({{ user.commits.totalCount }})</span>
      </div>
    </prioritized-portal>

    <v-row v-if="user && user.commits.totalCount !== 0">
      <v-col
        v-for="commit in commitItems"
        :key="commit.id"
        cols="12"
        sm="6"
        md="6"
        lg="4"
        xl="3"
      >
        <commit-preview-card :commit="commit" :preview-height="180" />
      </v-col>
      <v-col cols="12" sm="6" md="6" lg="4" xl="3">
        <infinite-loading spinner="waveDots" @infinite="infiniteHandler">
          <div slot="no-more">
            <v-col>You've reached the end - no more commits.</v-col>
          </div>
          <div slot="no-results">
            <v-col>You've reached the end - no more commits.</v-col>
          </div>
        </infinite-loading>
      </v-col>
    </v-row>
    <no-data-placeholder v-if="user && user.commits.totalCount === 0">
      <h2>Welcome {{ user.name.split(' ')[0] }}!</h2>
      <p class="caption">
        Once you create a stream and start sending some data, your activity will show up
        here.
      </p>
      <template #actions>
        <v-list rounded class="transparent">
          <v-list-item
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
  </div>
</template>
<script>
import { gql } from '@apollo/client/core'
import { useQuery } from '@vue/apollo-composable'
import { computed, defineComponent } from 'vue'
import PrioritizedPortal from '@/main/components/common/utility/PrioritizedPortal.vue'

export default defineComponent({
  name: 'TheCommits',
  components: {
    InfiniteLoading: () => import('vue-infinite-loading'),
    CommitPreviewCard: () => import('@/main/components/common/CommitPreviewCard'),
    NoDataPlaceholder: () => import('@/main/components/common/NoDataPlaceholder'),
    PrioritizedPortal
  },
  setup() {
    const { result, fetchMore: userFetchMore } = useQuery(gql`
      query ($cursor: String) {
        user {
          id
          name
          commits(limit: 10, cursor: $cursor) {
            totalCount
            cursor
            items {
              id
              referencedObject
              message
              streamName
              streamId
              createdAt
              sourceApplication
              branchName
              commentCount
            }
          }
        }
      }
    `)
    const user = computed(() => result.value?.user)
    const commitItems = computed(() =>
      (user.value?.commits.items || []).filter((c) => c.branchName !== 'globals')
    )

    return {
      user,
      commitItems,
      userFetchMore
    }
  },
  methods: {
    async infiniteHandler($state) {
      const result = await this.userFetchMore({
        variables: {
          cursor: this.user.commits.cursor
        }
      })

      const newItems = result.data?.user?.commits?.items || []
      if (!newItems.length) {
        $state.complete()
      } else {
        $state.loaded()
      }
    }
  }
})
</script>
