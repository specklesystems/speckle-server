<template>
  <div>
    <portal to="streamTitleBar">
      <div v-if="stream && stream.branch">
        <v-icon small class="mr-1">mdi-source-branch</v-icon>
        <span class="space-grotesk" style="max-width: 80%">{{ stream.branch.name }}</span>
        <span class="caption ml-2 mb-2 pb-2">{{ stream.branch.description }}</span>
        <v-chip
          v-tooltip="`Branch ${stream.branch.name} has ${stream.branch.commits.totalCount} commits`"
          class="ml-2 pl-2"
          small
        >
          <v-icon small>mdi-source-commit</v-icon>
          {{ stream.branch.commits.totalCount }}
        </v-chip>
      </div>
    </portal>
    <portal to="streamActionsBar">
      <v-btn
        v-if="
          loggedInUserId &&
          stream &&
          stream.role !== 'stream:reviewer' &&
          stream.branch &&
          stream.branch.name !== 'main'
        "
        v-tooltip="'Edit branch'"
        elevation="0"
        color="primary"
        small
        rounded
        :fab="$vuetify.breakpoint.mdAndDown"
        dark
        @click="editBranch()"
      >
        <v-icon small :class="`${$vuetify.breakpoint.mdAndDown ? '' : 'mr-2'}`">mdi-pencil</v-icon>
        <span class="hidden-md-and-down">Edit</span>
      </v-btn>
    </portal>
    <v-row no-gutters>
      <v-col v-if="$apollo.loading">
        <v-skeleton-loader type="article, article"></v-skeleton-loader>
      </v-col>
      <v-col v-else-if="stream && stream.branch" cols="12" class="pa-0 ma-0">
        <branch-edit-dialog ref="editBranchDialog" />

        <div v-if="latestCommitObjectUrl && !$route.params.branchName.includes('presentations/')" style="height: 60vh">
          <renderer :object-url="latestCommitObjectUrl" :object-main-url="latestCommitObjectMainUrl" show-selection-helper />
        </div>
        <div v-if="$route.params.branchName.includes('presentations/')" style="height: 60vh">
          <renderer-presentation :object-url="latestCommitObjectUrl" :object-existing-url="latestExistingCommitUrl" :branch-id="branchId" :branch-desc="branchDesc" :presentation-data="presentationData" show-selection-helper />
        </div>

        <v-list v-if="stream.branch.commits.items.length > 0 && !$route.params.branchName.includes('presentations/')" class="pa-0 ma-0">
          <list-item-commit
            :commit="latestCommit"
            :stream-id="streamId"
            class="elevation-3"
            show-received-receipts
          ></list-item-commit>
          <v-divider></v-divider>
          <v-subheader class="ml-5">
            {{ stream.branch.commits.items.length > 1 ? 'Older commits:' : 'No other commits.' }}
          </v-subheader>
          <list-item-commit
            v-for="item in allPreviousCommits"
            :key="item.id"
            :commit="item"
            :stream-id="streamId"
            show-received-receipts
          ></list-item-commit>

          <!-- TODO: pagination -->
        </v-list>
      </v-col>

      <no-data-placeholder
        v-if="( !$apollo.loading && stream.branch && stream.branch.commits.totalCount === 0) && !$route.params.branchName.includes('presentations/')"
      >
        <h2 class="space-grotesk">Branch "{{ stream.branch.name }}" has no commits.</h2>
      </no-data-placeholder>
    </v-row>
    <error-placeholder
      v-if="!$apollo.loading && (error || stream.branch === null)"
      error-type="404"
    >
      <h2>{{ error || `Branch "${$route.params.branchName}" does not exist.` }}</h2>
    </error-placeholder>
  </div>
</template>
<script>
import gql from 'graphql-tag'
import branchQuery from '@/graphql/branch.gql'
import StreamQuery from '@/graphql/stream.gql'
//import RendererPresentation from '../../components/RendererPresentation.vue'

export default {
  name: 'Branch',
  components: {
    ListItemCommit: () => { import('@/components/ListItemCommit') },
    BranchEditDialog: () => import('@/components/dialogs/BranchEditDialog'),
    NoDataPlaceholder: () => import('@/components/NoDataPlaceholder'),
    ErrorPlaceholder: () => import('@/components/ErrorPlaceholder'),
    Renderer: () => import('@/components/Renderer'),
    RendererPresentation: () => import('@/components/RendererPresentation')
  },
  data() {
    return {
      dialogEdit: false,
      error: null
    }
  },
  apollo: {
    stream: {
      query: branchQuery,
      variables() {
        return {
          streamId: this.streamId,
          branchName: this.$route.params.branchName.toLowerCase()
        }
      }
    },
    streamMain: {
      query: branchQuery,
      update: (data) => data.stream,
      variables() {
        return {
          streamId: this.streamId,
          branchName: 'main'
        }
      }
    },
    streamQuery: {
      query: StreamQuery,
      update: (data) => data.stream,
      variables() {
        return {
          id: this.$route.params.streamId,
        }
      },
    },
    $subscribe: {
      commitCreated: {
        query: gql`
          subscription($streamId: String!) {
            commitCreated(streamId: $streamId)
          }
        `,
        variables() {
          return {
            streamId: this.streamId
          }
        },
        result() {
          this.$apollo.queries.stream.refetch()
          this.$apollo.queries.streamMain.refetch()
        },
        error(err) {
          console.log(err)
        }
      }
    }
  },
  computed: {
    loggedInUserId() {
      return localStorage.getItem('uuid')
    },
    streamId() {
      return this.$route.params.streamId
    },
    branchId() {
      return this.stream.branch.id
    },
    branchDesc() {
      return this.stream.branch.description
    },
    presentationData() {
      if (this.stream.branch.presentationData) return this.stream.branch.presentationData
      else return "" 
    },
    latestCommitObjectUrl() {
      if (
        this.stream &&
        this.stream.branch &&
        this.stream.branch.commits.items &&
        this.stream.branch.commits.items.length > 0
      )
        return `${window.location.origin}/streams/${this.stream.id}/objects/${this.stream.branch.commits.items[0].referencedObject}`
      else return null
    },
    latestCommitObjectMainUrl() {
      if (
        this.streamMain &&
        this.streamMain.branch &&
        this.streamMain.branch.commits.items &&
        this.streamMain.branch.commits.items.length > 0
      )
        return `${window.location.origin}/streams/${this.streamMain.id}/objects/${this.streamMain.branch.commits.items[0].referencedObject}`
      else return null
    },
    latestExistingCommitUrl() {
      if (
        this.streamQuery &&
        this.streamQuery.commits.items &&
        this.streamQuery.commits.items.length > 0
      )
        return `${window.location.origin}/streams/${this.streamQuery.id}/objects/${this.streamQuery.commits.items[0].referencedObject}`
      else return null
    },
    latestCommit() {
      if (this.stream.branch.commits.items && this.stream.branch.commits.items.length > 0)
        return this.stream.branch.commits.items[0]
      else return null
    },
    allPreviousCommits() {
      if (this.stream.branch.commits.items && this.stream.branch.commits.items.length > 0)
        return this.stream.branch.commits.items.slice(1)
      else return null
    }
  },
  mounted() {
    if (this.$route.params.branchName === 'globals')
      this.$router.push(`/streams/${this.$route.params.streamId}/globals`)
  },
  methods: {
    editBranch() {
      this.$refs.editBranchDialog.open(this.stream.branch).then((dialog) => {
        if (!dialog.result) return
        else if (dialog.deleted) {
          this.$emit('refetch-branches')
          this.$router.push({ path: `/streams/${this.streamId}` })
        } else if (dialog.name !== this.$route.params.branchName) {
          //this.$router.push does not work, refresh entire window

          this.$router.push({
            path: `/streams/${this.streamId}/branches/${encodeURIComponent(dialog.name)}`
          })
        } else {
          this.$emit('refetch-branches')
          this.$apollo.queries.stream.refetch()
        }
      })
    }
  }
}
</script>
<style scoped>
.v-item-group {
  float: left;
}

.clear {
  clear: both;
}
</style>
