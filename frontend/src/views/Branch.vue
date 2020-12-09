<template>
  <v-container>
    <v-row v-if="$apollo.loading">
      <v-col cols="12">
        <v-skeleton-loader type="article, article"></v-skeleton-loader>
      </v-col>
    </v-row>
    <v-row v-else>
      <v-col cols="12" sm="12" lg="3" md="4">
        <sidebar-stream :stream="stream"></sidebar-stream>
      </v-col>
      <v-col cols="12" sm="12" lg="9" md="8">
        <v-row>
          <v-col>
            <v-card class="pa-4" elevation="0" rounded="lg" color="background2">
              <v-card-title class="mr-8">
                <v-icon class="mr-2">mdi-source-branch</v-icon>
                {{ branch.name }}
              </v-card-title>
              <v-card-text>
                {{ branch.description }}
              </v-card-text>
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
      </v-col>
    </v-row>
  </v-container>
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
  watch: {
    stream(val) {
      console.log(val)
    }
  },
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
