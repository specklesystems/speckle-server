<template>
  <v-container>
    <v-row v-if="stream">
      <v-col cols="12" sm="12" lg="3" md="4">
        <sidebar-stream :stream="stream"></sidebar-stream>
      </v-col>
      <v-col cols="12" sm="12" lg="9" md="8">
        <v-row>
          <v-col>
            <v-card class="pa-4" elevation="0" rounded="lg" color="background2">
              <v-card-title class="mr-8">
                <v-icon class="mr-2">mdi-source-commit</v-icon>
                {{ stream.commit.message }}
              </v-card-title>
              <v-card-text>
                {{ stream.commit.referencedObject }}
              </v-card-text>
              <!-- TODO need an endpoint to get a commit by ID
               -->
              <v-subheader class="text-uppercase">WORK IN PROGRESS</v-subheader>

              <commit-dialog ref="commitDialog"></commit-dialog>
              <v-btn
                v-tooltip="'Edit commit details'"
                small
                icon
                style="position: absolute; right: 15px; top: 15px"
                @click="editBranch"
              >
                <v-icon small>mdi-pencil-outline</v-icon>
              </v-btn>
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
import streamCommitQuery from "../graphql/commit.gql"
import CommitDialog from "../components/dialogs/CommitDialog"

export default {
  name: "Commit",
  components: { SidebarStream, CommitDialog },
  data: () => ({ selectedBranch: 0 }),
  apollo: {
    stream: {
      prefetch: true,
      query: streamCommitQuery,
      variables() {
        // Use vue reactive properties here
        return {
          streamid: this.$route.params.streamId,
          id: this.$route.params.commitId
        }
      }
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
