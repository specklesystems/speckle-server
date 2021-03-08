<template>
  <v-row>
    <v-col sm="12">
      <v-card v-if="$apollo.queries.branches.loading">
        <v-skeleton-loader type="card-heading, card-avatar, article"></v-skeleton-loader>
      </v-card>
      <v-card v-else class="mb-4 transparent" rounded="lg" elevation="0">
        <v-sheet class="px-5 pt-5 align-center justify-center" color="background2">
          <v-select
            v-if="branches"
            v-model="selectedBranch"
            :items="branches.items"
            item-value="name"
            solo
            flat
            return-object
            background-color="background"
            class="d-inline-block mt-2 mr-4 mb-0 pb-0"
            @change="changeBranch"
          >
            <template #selection="{ item }">
              <v-icon class="mr-2">mdi-source-branch</v-icon>
              {{ item.name }}
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
            {{ branches.totalCount }} branch{{ branches.totalCount > 1 ? 'es' : '' }}
          </v-btn>

          <v-btn
            v-if="selectedBranch"
            class="mx-2 mb-2"
            color="primary"
            text
            plain
            :to="
              '/streams/' +
              $route.params.streamId +
              '/branches/' +
              encodeURIComponent(selectedBranch.name) +
              '/commits'
            "
          >
            <v-icon class="mr-2 float-left">mdi-source-commit</v-icon>
            {{ selectedBranch.commits.totalCount }} commit{{
              selectedBranch.commits.totalCount > 1 ? 's' : ''
            }}
          </v-btn>
        </v-sheet>

        <div v-if="latestCommit" style="height: 50vh">
          <renderer :object-url="latestCommitObjectUrl" />
        </div>

        <v-sheet v-if="latestCommit" color="background2">
          <v-list-item>
            <v-list-item-icon class="mt-5 mr-4">
              <user-avatar
                :id="latestCommit.authorId"
                :avatar="latestCommit.authorAvatar"
                :name="latestCommit.authorName"
                :size="40"
              />
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title class="mb-2 pt-1">
                Last commit:
                <router-link
                  :to="'/streams/' + $route.params.streamId + '/commits/' + latestCommit.id"
                >
                  {{ latestCommit.message }}
                </router-link>
              </v-list-item-title>
              <v-list-item-subtitle class="caption">
                <b>{{ latestCommit.authorName }}</b>
                &nbsp;
                <timeago :datetime="latestCommit.createdAt"></timeago>
              </v-list-item-subtitle>
            </v-list-item-content>
            <v-list-item-action class="mr-4">
              <v-row align="center" justify="center">
                <v-chip small class="mr-2">
                  <v-icon small class="mr-2">mdi-source-branch</v-icon>
                  {{ latestCommit.branchName }}
                </v-chip>
                <source-app-avatar :application-name="latestCommit.sourceApplication" />
              </v-row>
            </v-list-item-action>
          </v-list-item>
        </v-sheet>

        <v-sheet v-else-if="selectedBranch" color="background2">
          <v-card-text class="pb-7 px-7">
            <i>
              It's a bit lonely here,
              <b>{{ selectedBranch.name }}</b>
              has no data yet.
              <br />
              Check out our 📚
              <a href="https://speckle.guide">User Guide</a>
              on how to send data to this branch!
            </i>
          </v-card-text>
        </v-sheet>
      </v-card>

      <v-card
        v-if="$apollo.queries.description.loading || $apollo.queries.branches.loading"
        class="mt-5"
      >
        <v-skeleton-loader type="article"></v-skeleton-loader>
      </v-card>

      <v-card v-else rounded="lg" class="pa-4 mb-4" elevation="0" color="background2">
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
</template>
<script>
import marked from 'marked'
import DOMPurify from 'dompurify'
import gql from 'graphql-tag'
import StreamDescriptionDialog from '../components/dialogs/StreamDescriptionDialog'
import SourceAppAvatar from '../components/SourceAppAvatar'
import streamCommitsQuery from '../graphql/streamCommits.gql'
import streamBranchesQuery from '../graphql/streamBranches.gql'
import Renderer from '../components/Renderer'
import UserAvatar from '../components/UserAvatar'

export default {
  name: 'StreamMain',
  components: {
    UserAvatar,
    StreamDescriptionDialog,
    SourceAppAvatar,
    Renderer
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
      selectedBranch: null
    }
  },
  apollo: {
    commits: {
      query: streamCommitsQuery,
      variables() {
        return {
          id: this.$route.params.streamId
        }
      },
      update: (data) => data.stream.commits
    },
    branches: {
      query: streamBranchesQuery,
      variables() {
        return {
          id: this.$route.params.streamId
        }
      },
      update(data) {
        // data.stream.branches.items = data.stream.branches.items.reverse()
        return data.stream.branches
      },
      result() {
        //this.branches.items = this.branches.items.reverse()
        //this.selectBranch()
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
    }
  },
  computed: {
    branchNames() {
      if (!this.branches) return []
      return this.branches.items.map((b) => b.name)
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
    this.$apollo.queries.commits.refetch()
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
      let index = this.branches.items.findIndex((x) => x.name === branchName)
      if (index > -1) this.selectedBranch = this.branches.items[index]
    },
    changeBranch() {
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
