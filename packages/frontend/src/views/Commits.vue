<template>
  <v-row>
    <v-col v-if="$apollo.loading">
      <v-skeleton-loader type="article, article"></v-skeleton-loader>
    </v-col>
    <v-col v-else cols="12">
      <v-card class="pa-4" elevation="0" rounded="lg" color="background2">
        <v-dialog v-model="dialogEdit" max-width="500">
          <branch-edit-dialog :branch="stream.branch" @close="closeEdit" />
        </v-dialog>
        <v-card-title class="mr-8">
          <v-icon class="mr-2">mdi-source-branch</v-icon>
          {{ stream.branch.name }}
          <v-spacer />
          <v-btn
            v-if="userRole === 'contributor' || userRole === 'owner'"
            small
            plain
            color="primary"
            text
            class="px-0"
            @click="dialogEdit = true"
          >
            <v-icon small class="mr-2 float-left">mdi-cog-outline</v-icon>
            Edit branch
          </v-btn>
        </v-card-title>
        <v-breadcrumbs :items="breadcrumbs" divider="/"></v-breadcrumbs>
        <v-card-text v-if="stream.branch.description">
          {{ stream.branch.description }}
        </v-card-text>
        <v-card-text v-else>
          <i>No description provided</i>
        </v-card-text>
      </v-card>

      <v-card class="mt-5 pa-4" elevation="0" rounded="lg" color="background2">
        <v-subheader class="text-uppercase">
          Commits ({{ stream.branch.commits.totalCount }})
        </v-subheader>
        <v-card-text v-if="stream.branch.commits.totalCount === 0">
          <i>
            It's a bit lonely here,
            <b>{{ stream.branch.name }}</b>
            has no data yet.
            <br />
            Check out our 📚
            <a href="https://speckle.guide">User Guide</a>
            on how to send data to this branch!
          </i>
        </v-card-text>
        <v-card-text>
          <list-item-commit
            v-for="item in stream.branch.commits.items"
            :key="item.id"
            :commit="item"
            :stream-id="streamId"
          ></list-item-commit>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>
<script>
import gql from 'graphql-tag'
import branchQuery from '../graphql/branch.gql'
import ListItemCommit from '../components/ListItemCommit'
import BranchEditDialog from '../components/dialogs/BranchEditDialog'

export default {
  name: 'Branch',
  components: { ListItemCommit, BranchEditDialog },
  props: {
    userRole: {
      type: String,
      default: null
    }
  },
  data() {
    return {
      dialogEdit: false
    }
  },
  apollo: {
    stream: {
      query: branchQuery,
      variables() {
        return {
          streamId: this.$route.params.streamId,
          branchName: this.$route.params.branchName
        }
      },
      error(error) {
        this.$router.push({ path: '/error' })
      }
    }
  },
  computed: {
    streamId() {
      return this.$route.params.streamId
    },
    breadcrumbs() {
      return [
        {
          text: this.stream.name,
          disabled: false,
          exact: true,
          to: '/streams/' + this.stream.id
        },
        {
          text: 'branches',
          disabled: false,
          exact: true,
          to: '/streams/' + this.stream.id + '/branches/'
        },
        {
          text: this.stream.branch.name,
          disabled: true,
          exact: true,
          to:
            '/streams/' +
            this.stream.id +
            '/branches/' +
            encodeURIComponent(this.stream.branch.name)
        }
      ]
    }
  },
  methods: {
    closeEdit({ name, deleted }) {
      this.dialogEdit = false
      if (deleted) {
        this.$router.push({ path: `/streams/${this.streamId}` })
        return
      }
      if (name !== this.$route.params.branchName) {
        this.$router.push({
          path: `/streams/${this.streamId}/branches/${encodeURIComponent(name)}`
        })
        return
      }
      this.$apollo.queries.stream.refetch()
    },
    editBranch() {
      this.$refs.commitDialog.open(this.stream.commit, this.stream.id).then((dialog) => {
        if (!dialog.result) return

        this.$matomo && this.$matomo.trackPageView('branch/update')
        this.$apollo
          .mutate({
            mutation: gql`
              mutation commitUpdate($myCommit: CommitUpdateInput!) {
                commitUpdate(commit: $myCommit)
              }
            `,
            variables: {
              myCommit: { ...dialog.commit }
            }
          })
          .then((data) => {
            this.$apollo.queries.stream.refetch()
          })
          .catch((error) => {
            // Error
            console.error(error)
          })
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
