<template>
  <div>
    <v-row v-if="commits.length != 0" dense>
      <v-col
        v-for="commit in commits"
        :key="commit.id + 'card'"
        cols="12"
        sm="6"
        md="4"
      >
        <v-card @click.stop="$emit('add-resource', commit.id)">
          <preview-image
            :height="180"
            :url="`/preview/${streamId}/commits/${commit.id}`"
          ></preview-image>
          <div style="position: absolute; top: 10px; right: 20px">
            <commit-received-receipts
              :stream-id="streamId"
              :commit-id="commit.id"
              shadow
            />
          </div>
          <div style="position: absolute; top: 10px; left: 12px">
            <source-app-avatar :application-name="commit.sourceApplication" />
          </div>
          <list-item-commit
            transparent
            :show-source-app="false"
            :show-branch="false"
            :links="false"
            :commit="commit"
            :stream-id="streamId"
          ></list-item-commit>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="4">
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
  </div>
</template>
<script>
import { gql } from '@apollo/client/core'
export default {
  components: {
    InfiniteLoading: () => import('vue-infinite-loading'),
    ListItemCommit: () => import('@/main/components/stream/ListItemCommit'),
    PreviewImage: () => import('@/main/components/common/PreviewImage'),
    CommitReceivedReceipts: () =>
      import('@/main/components/common/CommitReceivedReceipts'),
    SourceAppAvatar: () => import('@/main/components/common/SourceAppAvatar')
  },
  props: {
    streamId: {
      type: String,
      default: () => null
    },
    branchName: {
      type: String,
      default: () => null
    }
  },
  data() {
    return {
      skip: true,
      cursor: new Date().toISOString(),
      commits: []
    }
  },
  async mounted() {
    this.fetchBranchCommits()
  },
  methods: {
    async fetchBranchCommits() {
      const res = await this.$apollo.query({
        query: gql`
          query {
            stream(id: "${this.streamId}") {
              id
              branch(name: "${this.branchName}") {
                name
                commits( cursor: "${this.cursor}", limit: 2) {
                  totalCount
                  cursor
                  items {
                    sourceApplication
                    id
                    createdAt
                    authorId
                    branchName
                    message
                    referencedObject
                  }
                }
              }
            }
          }
        `
      })
      const items = res.data.stream.branch.commits.items
      this.cursor = res.data.stream.branch.commits.cursor
      items.forEach((item) => this.commits.push(item))
      return items
    },
    async infiniteHandler($state) {
      const items = await this.fetchBranchCommits()
      if (items.length === 0) $state.complete()
      else $state.loaded()
    }
  }
}
</script>
