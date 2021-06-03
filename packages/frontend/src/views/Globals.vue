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
        :user-role="$attrs['user-role']"
        @new-commit="$apollo.queries.branch.refetch()"
      />
      <v-card>
        <v-card-title>History</v-card-title>
        <v-card-text>TODO</v-card-text>
      </v-card>
    </div>
  </v-container>
</template>

<script>
import gql from 'graphql-tag'
import branchQuery from '../graphql/branch.gql'
import GlobalsBuilder from '../components/GlobalsBuilder'

export default {
  name: 'Globals',
  components: {
    GlobalsBuilder
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
      branchName: 'globals', //TODO: handle multipile globals branches
      revealBuilder: false,
      loading: false
    }
  },
  computed: {
    streamId() {
      return this.$route.params.streamId
    },
    objectId() {
      return this.branch?.commits?.items[0]?.referencedObject
    }
  },
  methods: {
    async createClicked() {
      if (!this.branch) {
        this.loading = true
        this.$matomo && this.$matomo.trackPageView('branch/create')
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
    }
  }
}
</script>

<style scoped></style>
