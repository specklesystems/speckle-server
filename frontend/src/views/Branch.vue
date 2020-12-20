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
                Copy and paste this page's url into a text panel and connect
                that to the "Stream" input of a receiver component or sender
                component.
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
        <v-subheader class="text-uppercase">
          Commits ({{ branch.commits.totalCount }})
        </v-subheader>
        <v-card-text>
          <list-item-commit
            v-for="item in branch.commits.items"
            :key="item.id"
            :commit="item"
            :stream-id="stream.id"
          ></list-item-commit>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>
<script>
import gql from "graphql-tag"
import SidebarStream from "../components/SidebarStream"
import streamQuery from "../graphql/stream.gql"
import branchQuery from "../graphql/branch.gql"
import ListItemCommit from "../components/ListItemCommit"
import CommitDialog from "../components/dialogs/CommitDialog"

export default {
  name: "Commit",
  components: { SidebarStream, CommitDialog, ListItemCommit },
  data: () => ({ selectedBranch: 0 }),
  apollo: {
    stream: {
      prefetch: true,
      query: streamQuery,
      variables() {
        return {
          id: this.$route.params.streamId
        }
      }
    },
    branch: {
      prefetch: true,
      query: branchQuery,
      variables() {
        return {
          streamId: this.$route.params.streamId,
          branchName: this.$route.params.branchName
        }
      },
      update: (data) => data.stream.branch
    }
  },
  computed: {},
  methods: {
    editBranch() {
      this.$refs.commitDialog
        .open(this.stream.commit, this.stream.id)
        .then((dialog) => {
          if (!dialog.result) return

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
