<template>
  <v-row v-if="!error">
    <v-col sm="12">
      <v-card v-if="$apollo.queries.branches.loading">
        <v-skeleton-loader type="card-heading, card-avatar, article"></v-skeleton-loader>
      </v-card>
      <v-card v-else class="mb-4 transparent" rounded="lg" elevation="0">
        <v-sheet class="px-5 pt-5 align-center justify-center">
          <v-select
            v-if="branches"
            v-model="selectedBranch"
            :items="branches"
            item-value="name"
            solo
            flat
            return-object
            background-color="background"
            class="d-inline-block mt-2 mr-4 mb-0 pb-0"
            style="max-width: 50%"
            @change="changeBranch"
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

          <v-btn
            class="mx-2 mb-2"
            color="primary"
            text
            plain
            :to="'/streams/' + $route.params.streamId + '/branches'"
          >
            <v-icon class="mr-2 float-left">mdi-source-branch</v-icon>
            {{ branches.length }} branch{{ branches.length > 1 ? 'es' : '' }}
          </v-btn>
        </v-sheet>

        <div v-if="latestCommit" style="height: 50vh">
          <renderer
            :object-url="latestCommitObjectUrl"
            :unload-trigger="clearRendererTrigger"
            show-selection-helper
          />
        </div>

        <v-sheet :class="latestCommit ? '' : 'rounded-b-lg'">
          <!-- LAST COMMIT -->
          <v-list v-if="latestCommit" two-line class="pa-0">
            <v-list-item :to="'/streams/' + $route.params.streamId + '/commits/' + latestCommit.id">
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
                  <b>Latest commit: {{ latestCommit.message }}</b>
                </v-list-item-title>
                <v-list-item-subtitle class="caption">
                  <b>{{ latestCommit.authorName }}</b>
                  &nbsp;
                  <timeago :datetime="latestCommit.createdAt"></timeago>
                </v-list-item-subtitle>
              </v-list-item-content>
              <v-list-item-action>
                <source-app-avatar :application-name="latestCommit.sourceApplication" />
              </v-list-item-action>
            </v-list-item>
          </v-list>
          <!-- LAST 2 COMMITS -->
          <v-list v-if="selectedBranch" dense color="transparent" class="mb-0 pa-0">
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
                  <source-app-avatar :application-name="latestCommit.sourceApplication" />
                </v-list-item-action>
              </v-list-item>
              <v-divider />
            </div>
            <v-divider v-if="!latestCommit" />
            <v-list-item>
              <v-list-item-content>
                <v-btn
                  v-if="selectedBranch"
                  color="primary"
                  text
                  :to="
                    '/streams/' +
                    $route.params.streamId +
                    '/branches/' +
                    encodeURIComponent(selectedBranch.name) +
                    '/commits'
                  "
                >
                  <v-icon class="mr-2 float-left">mdi-source-commit</v-icon>
                  {{ commitsPageText }}
                </v-btn>
              </v-list-item-content>
            </v-list-item>
          </v-list>
        </v-sheet>
        <no-data-placeholder v-if="!latestCommit" :message="`This branch has no commits.`" />
      </v-card>

      <v-card
        v-if="$apollo.queries.description.loading || $apollo.queries.branches.loading"
        class="mt-5"
      >
        <v-skeleton-loader type="article"></v-skeleton-loader>
      </v-card>

      <v-card v-else rounded="lg" class="pa-4 mb-4" elevation="0">
        <v-dialog v-model="dialogDescription">
          <stream-description-dialog
            :id="$route.params.streamId"
            :description="description"
            @close="closeDescription"
          />
        </v-dialog>
        <v-card-title>
          Description
          <v-spacer />
          <v-btn
            v-if="userRole === 'owner'"
            small
            plain
            color="primary"
            text
            class="px-0"
            @click="dialogDescription = true"
          >
            <v-icon small class="mr-2 float-left">mdi-cog-outline</v-icon>
            Edit
          </v-btn>
        </v-card-title>
        <v-card-text
          v-if="description"
          class="marked-preview"
          v-html="compiledStreamDescription"
        ></v-card-text>
        <v-card-text v-else><i>No description provided</i></v-card-text>
      </v-card>
    </v-col>
  </v-row>
  <v-row v-else justify="center">
    <v-col cols="12" class="pt-10">
      <error-block :message="error" />
    </v-col>
  </v-row>
</template>
<script>
import marked from 'marked'
import DOMPurify from 'dompurify'
import gql from 'graphql-tag'
import StreamDescriptionDialog from '../components/dialogs/StreamDescriptionDialog'
import NoDataPlaceholder from '../components/NoDataPlaceholder'
import SourceAppAvatar from '../components/SourceAppAvatar'
import streamBranchesQuery from '../graphql/streamBranches.gql'
import Renderer from '../components/Renderer'
import UserAvatar from '../components/UserAvatar'
import ErrorBlock from '../components/ErrorBlock'

export default {
  name: 'StreamMain',
  components: {
    UserAvatar,
    StreamDescriptionDialog,
    SourceAppAvatar,
    NoDataPlaceholder,
    Renderer,
    ErrorBlock
  },
  props: {
    userRole: {
      type: String,
      default: null
    }
  },
  data() {
    return {
      dialogDescription: false,
      dialogBranch: false,
      selectedBranch: null,
      clearRendererTrigger: 0,
      error: ''
    }
  },
  apollo: {
    branches: {
      query: streamBranchesQuery,
      variables() {
        return {
          id: this.$route.params.streamId
        }
      },
      update(data) {
        return data.stream.branches.items.filter((b) => !b.name.startsWith('globals'))
      }
    },
    description: {
      query: gql`
        query($id: String!) {
          stream(id: $id) {
            id
            description
          }
        }
      `,
      variables() {
        return {
          id: this.$route.params.streamId
        }
      },
      update: (data) => data.stream.description
    },
    $subscribe: {
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
          this.$apollo.queries.branches.refetch()
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
          this.$apollo.queries.branches.refetch()
        },
        skip() {
          return !this.loggedIn
        }
      }
    }
  },
  computed: {
    commitsPageText() {
      if (this.selectedBranch.commits.totalCount > 1)
        return `SEE ALL ${this.selectedBranch.commits.totalCount} COMMITS`

      if (this.selectedBranch.commits.totalCount === 1) return `SEE 1 COMMIT`

      return `SEE BRANCH DETAILS`
    },
    branchNames() {
      if (!this.branches) return []
      return this.branches.map((b) => b.name)
    },
    compiledStreamDescription() {
      if (!this.description) return ''
      let md = marked(this.description)
      return DOMPurify.sanitize(md)
    },
    latestCommit() {
      if (!this.selectedBranch) return null
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
    '$route.params.branchName': {
      handler: function (to, from) {
        this.selectBranch()
      },
      deep: true,
      immediate: true
    },
    branches() {
      this.selectBranch()
    }
  },
  mounted() {
    this.$apollo.queries.branches.refetch()
    this.$apollo.queries.description.refetch()
  },
  methods: {
    closeDescription() {
      this.dialogDescription = false
      this.$apollo.queries.description.refetch()
    },
    closeBranchDialog() {
      this.dialogBranch = false
      this.$apollo.queries.branches.refetch()
    },
    selectBranch() {
      if (!this.branches) return
      let branchName = this.$route.params.branchName ? this.$route.params.branchName : 'main'
      let index = this.branches.findIndex((x) => x.name === branchName)
      if (index > -1) this.selectedBranch = this.branches[index]
      else this.error = 'Branch ' + branchName + ' does not exist'
    },
    changeBranch() {
      this.clearRendererTrigger += 42
      this.$router.push({
        path:
          '/streams/' +
          this.$route.params.streamId +
          '/branches/' +
          encodeURIComponent(this.selectedBranch.name)
      })
    }
  }
}
</script>
