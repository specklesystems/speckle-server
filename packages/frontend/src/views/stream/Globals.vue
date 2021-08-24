<template>
  <v-container style="max-width: 768px">
    <portal to="streamTitleBar">
      <div style="display: inline-block">
        <v-icon small class="mx-1">mdi-earth</v-icon>
        <span class="space-grotesk" style="max-width: 80%">Globals</span>
      </div>
    </portal>

    <div v-if="!objectId && !$apollo.loading && !revealBuilder && false">
      <v-card
        :loading="loading"
        class="mt-5 pa-4"
        elevation="0"
        rounded="lg"
        :class="`${!$vuetify.theme.dark ? 'grey lighten-5' : ''}`"
      >
        <template slot="progress">
          <v-progress-linear indeterminate></v-progress-linear>
        </template>
        <v-card-text class="subtitle-1">
          There are no globals in this stream yet.
          <br />
          Globals are useful for storing design values, project requirements, notes, or any info you
          want to keep track of alongside your geometry.
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

    <no-data-placeholder
      :show-message="false"
      v-if="!objectId && !$apollo.loading && !revealBuilder"
    >
      <h2>There are no global variables in this stream.</h2>
      <p class="caption">
        Global variables can hold various information that's useful across the project: location
        (city, adress, lat & long coordinates), custom project names or tags, or any other numbers
        or text that you want to keep track of.
      </p>
      <template v-slot:actions>
        <v-list rounded class="transparent">
          <v-list-item link class="primary mb-4" dark @click="createGlobals()">
            <v-list-item-icon>
              <v-icon>mdi-plus-box</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>Create Globals</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
          <v-list-item
            link
            :class="`grey ${$vuetify.theme.dark ? 'darken-4' : 'lighten-4'} mb-4`"
            href="https://speckle.guide/user/web.html#globals"
            target="_blank"
          >
            <v-list-item-icon>
              <v-icon>mdi-book-open-variant</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>Globals docs</v-list-item-title>
              <v-list-item-subtitle class="caption">
                Read the documentation on webhooks.
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </template>
    </no-data-placeholder>

    <div v-if="objectId || revealBuilder">
      <!-- Help -->

      <v-card elevation="0" rounded="lg" :class="`${!$vuetify.theme.dark ? 'grey lighten-5' : ''}`">
        <v-toolbar
          flat
          :class="`${!$vuetify.theme.dark ? 'grey lighten-4' : ''} mb-2`"
        >
          <v-toolbar-title>
            <v-icon class="mr-2" small>mdi-earth</v-icon>
            <span class="d-inline-block">What are Globals?</span>
          </v-toolbar-title>
        </v-toolbar>

        <v-card-text>
          <p class="caption">
            Globals are useful for storing design values, project requirements, notes, or any info
            you want to keep track of alongside your geometry. Read more on stream global variables
            <a href="https://speckle.guide/user/web.html#globals" target="_blank">here</a>
            .
            <v-divider class="my-2"></v-divider>
            <b>Global editor help:</b>
            Drag and drop fields in and out of groups as you please. Click the box icon next to any
            field to turn it into a nested group of fields.
          </p>
        </v-card-text>

        <v-alert
          v-if="!(stream.role === 'stream:contributor') && !(stream.role === 'stream:owner')"
          class="my-3"
          dense
          type="warning"
        >
          You are free to play around with the globals here, but you do not have the required stream
          permission to save your changes.
        </v-alert>
      </v-card>

      <!-- History -->
      <v-card
        v-if="!$apollo.loading && branch.commits.items.length"
        elevation="0"
        rounded="lg"
        :class="`${!$vuetify.theme.dark ? 'grey lighten-5' : ''} my-2 pa-0`"
        style="overflow: hidden"
      >
        <v-toolbar
          class="elevation-"
          flat
          :class="`${!$vuetify.theme.dark ? 'grey lighten-4' : ''}`"
        >
          <v-toolbar-title @click="showHistory = !showHistory" style="cursor: pointer;">
            <v-icon small class="mr-2">mdi-history</v-icon>
            Globals History ({{ branch.commits.totalCount }})
          </v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon @click="showHistory = !showHistory" class="mr-1">
            <v-icon>
              {{ !showHistory ? 'mdi-chevron-down' : 'mdi-chevron-up' }}
            </v-icon>
          </v-btn>
        </v-toolbar>

        <v-list class="pa-0 transparent" dense v-show="showHistory">
          <list-item-commit
            v-for="item in branch.commits.items"
            :key="item.id"
            :route="`/streams/${streamId}/globals/${item.id}`"
            :commit="item"
            :stream-id="streamId"
          />
        </v-list>
      </v-card>

      <!-- Builder -->
      <globals-builder
        :branch-name="branchName"
        :stream-id="streamId"
        :object-id="objectId"
        :commit-message="commit ? commit.message : null"
        :user-role="stream.role"
        @new-commit="newCommit"
      />
    </div>
  </v-container>
</template>

<script>
import gql from 'graphql-tag'
import branchQuery from '@/graphql/branch.gql'

export default {
  name: 'Globals',
  components: {
    GlobalsBuilder: () => import('@/components/GlobalsBuilder'),
    ListItemCommit: () => import('@/components/ListItemCommit'),
    NoDataPlaceholder: () => import('@/components/NoDataPlaceholder')
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
      loading: false,
      showHistory: false
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
    async createGlobals() {
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
