<template>
  <v-container>
    <div v-if="!objectId && !$apollo.loading && !revealBuilder">
      <v-card :loading="loading">
        <template slot="progress">
          <v-progress-linear indeterminate></v-progress-linear>
        </template>
        <v-card-title>You don't have any globals on this stream!</v-card-title>
        <v-card-text class="subtitle-1">
          Globals are useful for storing design values, project requirements, notes, or any info you
          want to keep track of alongside your geometry. Would you like to create some now?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" @click="createClicked">create globals</v-btn>
        </v-card-actions>
      </v-card>
    </div>
    <div v-if="objectId || revealBuilder">
      <globals-builder
        :branch-name="branchName"
        :stream-id="streamId"
        :object-id="objectId"
        :commit-message="commit ? commit.message : null"
        :user-role="$attrs['user-role']"
        @new-commit="newCommit"
      />
      <v-card v-if="!$apollo.loading && branch.commits.items.length">
        <v-card-title>History</v-card-title>
        <v-card-text>
          <list-item-commit
            v-for="item in branch.commits.items"
            :key="item.id"
            :route="`/streams/${streamId}/globals/${item.id}`"
            :commit="item"
            :stream-id="streamId"
          />
        </v-card-text>
      </v-card>
    </div>
  </v-container>
</template>

<script>
import gql from 'graphql-tag'
import branchQuery from '../graphql/branch.gql'

export default {
  name: 'Globals',
  components: {
    GlobalsBuilder: () => import('../components/GlobalsBuilder'),
    ListItemCommit: () => import('../components/ListItemCommit')
  },
  apollo: {
    branch: {
      query: branchQuery,
      variables() {
        return {
          streamId: this.streamId,
          branchName: this.branchName
        }
      },
      update(data) {
        return data.stream.branch
      }
    }
  },
  data() {
    return {
      branchName: 'globals', //TODO: handle multipile globals branches,

      revealBuilder: false,
      loading: false
    }
  },
  computed: {
    streamId() {
      return this.$route.params.streamId
    },
    commit() {
      return this.$route.params.commitId
        ? this.branch?.commits?.items?.filter((c) => c.id == this.$route.params.commitId)[0]
        : this.branch?.commits?.items[0]
    },
    objectId() {
      return this.commit?.referencedObject
    }
  },
  methods: {
    async createClicked() {
      if (!this.branch) {
        this.loading = true
        this.$matomo && this.$matomo.trackPageView('globals/branch/create')
        await this.$apollo.mutate({
          mutation: gql`
            mutation branchCreate($params: BranchCreateInput!) {
              branchCreate(branch: $params)
            }
          `,
          variables: {
            params: {
              streamId: this.streamId,
              name: 'globals',
              description: 'Stream globals'
            }
          }
        })
        this.$apollo.queries.branch.refetch()
        this.loading = false
      }

      this.revealBuilder = true
    },
    newCommit() {
      this.$apollo.queries.branch.refetch()
      if (this.$route.params.commitId) this.$router.push(`/streams/${this.streamId}/globals`)
    }
  }
}
</script>

<style scoped></style>
