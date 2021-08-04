<template>
  <v-row v-if="!error">
    <v-col v-if="$apollo.loading" cols="12">
      <v-skeleton-loader type="heading" class="mb-5"></v-skeleton-loader>
      <v-skeleton-loader type="text@3" class="mb-5"></v-skeleton-loader>
      <v-skeleton-loader type="list-item-two-line, image"></v-skeleton-loader>
    </v-col>
    <v-col v-if="stream" cols="12">
      <h1 class="display-1">{{ stream.name }}</h1>
      <h3
        class="title font-italic font-weight-thin my-5"
        v-html="hyperlink(truncate(stream.description))"
      ></h3>

      <!-- <v-card class="mt-5 pa-4" elevation="0" rounded="lg"> -->
      <v-row v-if="stream">
        <v-col cols="12" sm="12" md="8" lg="9" xl="9">
          <v-card class="mb-4" rounded="lg" elevation="0">
            <div class="pt-5 ml-7">
              <span class="title mb-3 mt-3 mr-3">Branch:</span>
              <v-select
                v-model="selectedBranch"
                :items="branches"
                item-value="name"
                solo
                flat
                return-object
                background-color="background"
                class="d-inline-block mt-2 mr-4 mb-0 pb-0"
                style="max-width: 50%"
              >
                <template #selection="{ item }">
                  <v-icon class="mr-2">mdi-source-branch</v-icon>
                  <span class="text-truncate">{{ item.name }}</span>
                </template>
                <template #item="{ item }">
                  <div class="pa-2">
                    <p class="pa-0 ma-0">{{ item.name }}</p>
                    <p class="caption pa-0 ma-0 grey--text">
                      {{ item.description }}
                    </p>
                  </div>
                </template>
              </v-select>
              <!-- <v-btn
                class="pa-3"
                color="primary"
                text
                block
                :to="'/streams/' + $route.params.streamId + '/commits/' + latestCommit.id"
              >
                <v-icon class="mr-2 float-left">mdi-source-commit</v-icon>
                See commit details
              </v-btn> -->
            </div>

            <div v-if="latestCommit">
              <div style="height: 50vh">
                <renderer
                  :object-url="latestCommitObjectUrl"
                  :unload-trigger="clearRendererTrigger"
                  show-selection-helper
                />
              </div>

              <v-list two-line class="pa-0" color="transparent">
                <v-list-item
                  :to="'/streams/' + $route.params.streamId + '/commits/' + latestCommit.id"
                >
                  <v-list-item-icon>
                    <user-avatar
                      :id="latestCommit.authorId"
                      :avatar="latestCommit.authorAvatar"
                      :name="latestCommit.authorName"
                      :size="30"
                    />
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title class="mb-2 pt-1">
                      <b>{{ latestCommit.message }}</b>
                      <i class="caption">&nbsp;(latest)</i>
                    </v-list-item-title>
                    <v-list-item-subtitle class="caption">
                      <b>{{ latestCommit.authorName }}</b>
                      &nbsp;
                      <timeago :datetime="latestCommit.createdAt"></timeago>
                    </v-list-item-subtitle>
                  </v-list-item-content>
                  <v-list-item-action>
                    <v-row align="center" justify="center">
                      <v-chip small class="mr-2 no-hover">
                        <v-icon small class="mr-2">mdi-source-commit</v-icon>
                        {{ latestCommit.id }}
                      </v-chip>

                      <source-app-avatar :application-name="latestCommit.sourceApplication" />
                    </v-row>
                  </v-list-item-action>
                </v-list-item>
              </v-list>
              <!-- LAST 2 COMMITS -->
              <v-list dense color="transparent" class="mb-0 pa-0">
                <div v-for="(commit, i) in selectedBranch.commits.items" :key="commit.id">
                  <v-list-item
                    v-if="i > 0"
                    :to="'/streams/' + $route.params.streamId + '/commits/' + commit.id"
                  >
                    <v-list-item-icon>
                      <user-avatar
                        :id="commit.authorId"
                        :avatar="commit.authorAvatar"
                        :name="commit.authorName"
                        :size="30"
                      />
                    </v-list-item-icon>
                    <v-list-item-content>
                      <v-list-item-title class="mb-2 pt-1">
                        {{ commit.message }}
                      </v-list-item-title>
                      <v-list-item-subtitle class="caption">
                        <b>{{ commit.authorName }}</b>
                        &nbsp;
                        <timeago :datetime="commit.createdAt"></timeago>
                      </v-list-item-subtitle>
                    </v-list-item-content>
                    <v-list-item-action>
                      <v-row align="center" justify="center">
                        <v-chip small class="mr-2 no-hover">
                          <v-icon small class="mr-2">mdi-source-commit</v-icon>
                          {{ commit.id }}
                        </v-chip>

                        <source-app-avatar :application-name="commit.sourceApplication" />
                      </v-row>
                    </v-list-item-action>
                  </v-list-item>
                  <v-divider />
                </div>
                <v-list-item
                  v-if="selectedBranch"
                  color="transparent"
                  :to="'/streams/' + $route.params.streamId + '/branches/' + selectedBranch.name"
                >
                  <v-row align="center" justify="center">
                    <span class="font-weight-bold primary--text py-3 my-4">
                      <v-icon class="mr-2 float-left" color="primary">mdi-source-commit</v-icon>
                      See all commits on
                      {{ selectedBranch.name }} ({{ selectedBranch.commits.totalCount }})
                    </span>
                  </v-row>
                </v-list-item>
              </v-list>
            </div>
          </v-card>
          <no-data-placeholder
            v-if="!latestCommit && selectedBranch"
            :message="'Branch ' + selectedBranch.name + ' has no commits.'"
          />
        </v-col>
        <v-col cols="12" sm="12" md="4" lg="3" xl="3">
          <h4 class="space-grotesk mb-3">About:</h4>
          <div>
            <v-chip class="mr-3 mb-3 no-hover">
              <v-icon small left>mdi-source-branch</v-icon>

              {{ stream.branches.totalCount }}
              branch{{ stream.branches.totalCount === 1 ? '' : 'es' }}
            </v-chip>
            <v-chip class="mr-3 mb-3 no-hover">
              <v-icon small left>mdi-source-commit</v-icon>
              &nbsp;

              {{ stream.commits.totalCount }}
              commit{{ stream.commits.totalCount === 1 ? '' : 's' }}
            </v-chip>
            <v-chip class="mr-3 mb-3 no-hover">
              <span
                v-if="stream.isPublic"
                v-tooltip="`Anyone can view this stream. Only you and collaborators can edit it.`"
              >
                <v-icon small left>mdi-lock-open-variant-outline</v-icon>
                &nbsp; public
              </span>
              <span v-else v-tooltip="`Only collaborators can access this stream.`">
                <v-icon small left>mdi-lock-outline</v-icon>
                &nbsp; private
              </span>
            </v-chip>
            <v-chip v-if="loggedIn" class="mr-3 mb-3 no-hover">
              <v-icon small left>mdi-account-key-outline</v-icon>
              {{ stream.role.split(':')[1] }}
            </v-chip>
          </div>
          <div class="my-3">
            <div class="caption mb-3">
              <span v-tooltip="formatDate(stream.createdAt)">
                Created
                <timeago :datetime="stream.createdAt"></timeago>
              </span>
            </div>
            <div class="caption">
              <span v-tooltip="formatDate(stream.updatedAt)">
                Updated
                <timeago :datetime="stream.updatedAt"></timeago>
              </span>
            </div>
          </div>
          <h4 class="space-grotesk mt-7 mb-3">Collaborators:</h4>
          <user-avatar
            v-for="collab in stream.collaborators"
            :id="collab.id"
            :key="collab.id"
            :size="30"
            :avatar="collab.avatar"
            :name="collab.name"
            class="ml-1"
          ></user-avatar>
        </v-col>
      </v-row>
      <v-row v-else-if="error" justify="center">
        <v-col cols="12" sm="12" md="8" lg="9" xl="8" class="pt-10">
          <error-block :message="error" />
        </v-col>
      </v-row>
      <!-- </v-card> -->
    </v-col>
  </v-row>
  <v-row v-else justify="center">
    <v-col cols="12" class="pt-10">
      <error-block :message="error" />
    </v-col>
  </v-row>
</template>
<script>
import streamBranchesQuery from '@/graphql/streamBranches.gql'
import gql from 'graphql-tag'

export default {
  name: 'Details',
  components: {
    UserAvatar: () => import('@/components/UserAvatar'),
    SourceAppAvatar: () => import('@/components/SourceAppAvatar'),
    NoDataPlaceholder: () => import('@/components/NoDataPlaceholder'),
    Renderer: () => import('@/components/Renderer'),
    ErrorBlock: () => import('@/components/ErrorBlock')
  },
  data() {
    return {
      clearRendererTrigger: 0,
      error: '',
      selectedBranch: null
    }
  },
  apollo: {
    stream: {
      query: streamBranchesQuery,
      variables() {
        return {
          id: this.$route.params.streamId
        }
      }
    },
    $subscribe: {
      streamUpdated: {
        query: gql`
          subscription($streamId: String!) {
            streamUpdated(streamId: $streamId)
          }
        `,
        variables() {
          return {
            streamId: this.$route.params.streamId
          }
        },
        result() {
          this.$apollo.queries.stream.refetch()
        },
        skip() {
          return !this.loggedIn
        }
      },
      branchCreated: {
        query: gql`
          subscription($streamId: String!) {
            branchCreated(streamId: $streamId)
          }
        `,
        variables() {
          return {
            streamId: this.$route.params.streamId
          }
        },
        result() {
          this.$apollo.queries.stream.refetch()
        },
        skip() {
          return !this.loggedIn
        }
      },
      branchDeleted: {
        query: gql`
          subscription($streamId: String!) {
            branchDeleted(streamId: $streamId)
          }
        `,
        variables() {
          return {
            streamId: this.$route.params.streamId
          }
        },
        result() {
          this.$apollo.queries.stream.refetch()
        },
        skip() {
          return !this.loggedIn
        }
      },
      commitCreated: {
        query: gql`
          subscription($streamId: String!) {
            commitCreated(streamId: $streamId)
          }
        `,
        variables() {
          return {
            streamId: this.$route.params.streamId
          }
        },
        result() {
          this.$apollo.queries.stream.refetch()
        },
        skip() {
          return !this.loggedIn
        }
      }
    }
  },
  computed: {
    branches() {
      return this.stream.branches.items.filter((b) => !b.name.startsWith('globals'))
    },
    latestCommit() {
      if (!this.selectedBranch || this.selectedBranch.commits.items.length === 0) return null
      return this.selectedBranch.commits.items[0]
    },
    latestCommitObjectUrl() {
      if (!this.latestCommit) return null
      return `${window.location.origin}/streams/${this.$route.params.streamId}/objects/${this.latestCommit.referencedObject}`
    },
    loggedIn() {
      return localStorage.getItem('uuid') !== null
    }
  },
  watch: {
    stream() {
      if (!this.stream) return
      let branchName = 'main'
      let index = this.branches.findIndex((x) => x.name === branchName)
      if (index > -1) this.selectedBranch = this.branches[index]
    }
  },

  methods: {
    hyperlink(text) {
      var exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gi
      return text.replace(exp, '<a target="_blank" href="$1">$1</a>')
    },
    truncate(input, length = 250) {
      if (!input) return ''
      if (input.length > length) {
        return input.substring(0, length) + '...'
      }
      return input
    },
    formatDate(d) {
      if (!this.stream) return null
      let date = new Date(d)
      let options = { year: 'numeric', month: 'short', day: 'numeric' }

      return date.toLocaleString(undefined, options)
    },
    changeBranch() {
      this.clearRendererTrigger += 42
    }
  }
}
</script>
