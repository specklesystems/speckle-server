<template>
  <v-row>
    <v-col>
      <breadcrumb-title />
      <h3 class="title font-italic font-weight-thin my-5">
        Globals store design values, project requirements, notes etc
      </h3>
      <div v-if="!objectId && !$apollo.loading && !revealBuilder">
        <v-card :loading="loading" class="mt-5 pa-4" elevation="0" rounded="lg">
          <template slot="progress">
            <v-progress-linear indeterminate></v-progress-linear>
          </template>
          <v-card-title>
            <v-icon class="mr-2">mdi-earth</v-icon>
            Globals
            <v-spacer />
            <v-btn
              v-if="stream.role === 'stream:contributor' || stream.role === 'stream:owner'"
              color="primary"
              dark
              class="ma-2"
              small
              @click="createClicked"
            >
              create globals
            </v-btn>
          </v-card-title>
          <v-card-text class="subtitle-1">
            There are no globals in this stream yet.
            <br />
            Globals are useful for storing design values, project requirements, notes, or any info
            you want to keep track of alongside your geometry.
            <strong v-if="!(stream.role === 'contributor') && !(stream.role === 'stream:owner')">
              <br />
              <br />
              You don't have permission to create globals in this stream.
            </strong>
            <v-btn
              text
              small
              color="primary"
              href="https://speckle.guide/user/web.html#globals"
              target="_blank"
            >
              Read the docs
            </v-btn>
          </v-card-text>
        </v-card>
      </div>
      <div v-if="objectId || revealBuilder">
        <globals-builder
          :branch-name="branchName"
          :stream-id="streamId"
          :object-id="objectId"
          :commit-message="commit ? commit.message : null"
          :user-role="stream.role"
          @new-commit="newCommit"
        />
        <v-card
          v-if="!$apollo.loading && branch.commits.items.length"
          class="pa-4"
          elevation="0"
          rounded="lg"
        >
          <v-card-title>
            <v-icon class="mr-2">mdi-history</v-icon>
            Globals History
          </v-card-title>
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
    </v-col>
  </v-row>
</template>

<script>
import gql from 'graphql-tag'
import branchQuery from '@/graphql/branch.gql'

export default {
  name: 'Globals',
  components: {
    GlobalsBuilder: () => import('@/components/GlobalsBuilder'),
    ListItemCommit: () => import('@/components/ListItemCommit'),
    BreadcrumbTitle: () => import('@/components/BreadcrumbTitle')
  },
  apollo: {
    stream: {
      query: gql`
        query Stream($id: String!) {
          stream(id: $id) {
            id
            name
            role
          }
        }
      `,
      variables() {
        return {
          id: this.$route.params.streamId
        }
      }
    },
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
