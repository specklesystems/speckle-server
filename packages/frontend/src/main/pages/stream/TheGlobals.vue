<template>
  <div>
    <portal v-if="canRenderToolbarPortal" to="toolbar">
      <div class="d-flex align-center">
        <div class="text-truncate">
          <router-link
            v-tooltip="stream.name"
            class="text-decoration-none space-grotesk mx-1"
            :to="`/streams/${stream.id}`"
          >
            <v-icon small class="primary--text mb-1 mr-1">mdi-folder</v-icon>
            <b>{{ stream.name }}</b>
          </router-link>
        </div>
        <div class="text-truncate flex-shrink-0">
          /
          <v-icon small class="mx-1 mb-1 hidden-xs-only">mdi-earth</v-icon>
          <span class="space-grotesk" style="max-width: 80%">Globals Variables</span>
        </div>
      </div>
    </portal>
    <no-data-placeholder
      v-if="!objectId && !$apollo.loading && !revealBuilder"
      :show-message="false"
    >
      <h2>There are no global variables in this stream.</h2>
      <p class="caption">
        Global variables can hold various information that's useful across the project:
        location (city, address, lat & long coordinates), custom project names or tags,
        or any other numbers or text that you want to keep track of.
      </p>
      <template #actions>
        <v-list rounded class="transparent">
          <v-list-item
            v-if="stream.role !== 'stream:reviewer'"
            link
            class="primary mb-4"
            dark
            @click="createGlobals()"
          >
            <v-list-item-icon>
              <v-icon>mdi-plus-box</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>Create Globals</v-list-item-title>
            </v-list-item-content>
          </v-list-item>

          <v-list-item v-else class="warning" dark>
            <v-list-item-icon>
              <v-icon small>mdi-lock</v-icon>
            </v-list-item-icon>
            <v-list-item-content class="caption">
              You do not have enough permissions to create globals.
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
                Read the documentation on global variables.
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </template>
    </no-data-placeholder>

    <div v-if="objectId || revealBuilder">
      <v-row>
        <!-- Help -->
        <v-col cols="12">
          <section-card>
            <v-card-text>
              Globals are useful for storing design values, project requirements, notes,
              or any info you want to keep track of alongside your geometry. Read more
              on stream global variables
              <a href="https://speckle.guide/user/web.html#globals" target="_blank">
                here
              </a>
              .
              <v-divider class="my-2"></v-divider>
              <b>Global editor help:</b>
              Drag and drop fields in and out of groups as you please. Click the box
              icon next to any field to turn it into a nested group of fields.
            </v-card-text>
            <v-alert
              v-if="
                !(stream.role === 'stream:contributor') &&
                !(stream.role === 'stream:owner')
              "
              class="my-3"
              dense
              type="warning"
            >
              You are free to play around with the globals here, but you do not have the
              required stream permission to save your changes.
            </v-alert>
          </section-card>
        </v-col>
        <!-- History -->
        <v-col v-if="branch" cols="12" md="4">
          <section-card v-if="branch.commits" expandable>
            <template slot="header">
              Globals History ({{ branch.commits.totalCount }})
            </template>
            <v-list
              v-if="branch.commits.totalCount !== 0"
              class="pa-0 transparent"
              dense
            >
              <list-item-commit
                v-for="item in branch.commits.items"
                :key="item.id"
                :route="`/streams/${streamId}/globals/${item.id}`"
                :commit="item"
                :stream-id="streamId"
                transparent
              />
            </v-list>
            <div v-else class="pa-2">No globals saved yet.</div>
          </section-card>
        </v-col>
        <v-col cols="12" md="8">
          <!-- Builder -->
          <globals-builder
            :branch-name="branchName"
            :stream-id="streamId"
            :object-id="objectId"
            :commit-message="commit ? commit.message : null"
            :user-role="stream.role"
            @new-commit="newCommit"
          />
        </v-col>
      </v-row>
    </div>
  </div>
</template>

<script>
import { gql } from '@apollo/client/core'
import branchQuery from '@/graphql/branch.gql'
import {
  STANDARD_PORTAL_KEYS,
  buildPortalStateMixin
} from '@/main/utils/portalStateManager'

export default {
  name: 'TheGlobals',
  components: {
    GlobalsBuilder: () => import('@/main/components/stream/globals/GlobalsBuilder'),
    ListItemCommit: () => import('@/main/components/stream/ListItemCommit'),
    SectionCard: () => import('@/main/components/common/SectionCard'),
    NoDataPlaceholder: () => import('@/main/components/common/NoDataPlaceholder')
  },
  mixins: [buildPortalStateMixin([STANDARD_PORTAL_KEYS.Toolbar], 'stream-globals', 1)],
  apollo: {
    stream: {
      query: gql`
        query StreamGlobalsMetadata($id: String!) {
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
      fetchPolicy: 'no-cache',
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
      showHistory: true
    }
  },
  computed: {
    streamId() {
      return this.$route.params.streamId
    },
    commit() {
      return this.$route.params.commitId
        ? this.branch?.commits?.items?.filter(
            (c) => c.id === this.$route.params.commitId
          )[0]
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
        this.$mixpanel.track('Globals Action', { type: 'action', name: 'create' })
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
      if (this.$route.params.commitId)
        this.$router.push(`/streams/${this.streamId}/globals`)
    }
  }
}
</script>
