<template>
  <v-row>
    <v-col v-if="$apollo.loading">
      <v-skeleton-loader type="article, article"></v-skeleton-loader>
    </v-col>
    <v-col v-else cols="12">
      <v-card class="pa-4" elevation="0" rounded="lg" color="background2">
        <v-card-title class="mr-8">
          <v-icon class="mr-2">mdi-source-branch</v-icon>
          {{ branch.name }}
        </v-card-title>
        <v-card-text>
          {{ branch.description }}
        </v-card-text>
        <v-card-actions v-if="userRole === 'contributor' || userRole === 'owner'">
          <v-btn small @click="dialogEdit = true">Edit</v-btn>
          <v-dialog v-model="dialogEdit" max-width="500">
            <branch-edit-dialog :branch="branch" @close="closeEdit" />
          </v-dialog>
        </v-card-actions>
      </v-card>
      <v-card>
        <v-expansion-panels flat focusable>
          <v-expansion-panel>
            <v-expansion-panel-header>
              <span>How to use this branch in desktop clients</span>
            </v-expansion-panel-header>
            <v-expansion-panel-content>
              <p class="caption mt-4">
                <b>Grasshopper & Dynamo:</b>
                Copy and paste this page's url into a text panel and connect that to the "Stream"
                input of a receiver component or sender component.
                <b>Senders</b>
                will push commits to this branch, whereas
                <b>receivers</b>
                will always pull the latest commit from this branch.
              </p>
              <p class="caption">
                <b>Other clients:</b>
                Select this branch from the UI. You will now be able to either
                <b>send</b>
                (push commits to), or
                <b>receive</b>
                the latest commit or a specified one.
              </p>
            </v-expansion-panel-content>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-card>
      <v-card class="pa-4" elevation="0" rounded="lg" color="background2">
        <v-subheader class="text-uppercase">Commits ({{ branch.commits.totalCount }})</v-subheader>
        <v-card-text v-if="branch.commits.totalCount === 0">
          It's a bit lonely here: there are no commits on this branch.
        </v-card-text>
        <v-card-text>
          <list-item-commit
            v-for="item in branch.commits.items"
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
    branch: {
      query: branchQuery,
      variables() {
        return {
          streamId: this.$route.params.streamId,
          branchName: this.$route.params.branchName
        }
      },
      update: (data) => data.stream.branch,
      error(error) {
        this.$router.push({ path: '/error' })
      }
    }
  },
  computed: {
    streamId() {
      return this.$route.params.streamId
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
      this.$apollo.queries.branch.refetch()
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
