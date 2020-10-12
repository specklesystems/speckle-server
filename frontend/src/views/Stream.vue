<template>
  <v-container>
    <v-row v-if="stream">
      <v-col cols="3">
        <sidebar-stream :stream="stream"></sidebar-stream>
      </v-col>
      <v-col cols="9">
        <v-row>
          <v-col class="pt-0">
            <v-card class="pa-5" elevation="0" rounded="lg">
              <v-subheader class="text-uppercase">Branches:</v-subheader>

              <v-chip-group
                v-model="selectedBranch"
                mandatory
                class="ml-3"
                active-class="primary--text text--accent-1"
              >
                <v-chip
                  v-for="(branch, i) in branches"
                  :key="i"
                  class="mb-3"
                  small
                >
                  {{ branch.name }}
                </v-chip>
              </v-chip-group>

              <!-- <v-btn
                class="mt-1 text-right"
                color="primary"
                elevation="0"
                small
                @click="newBranch"
              >
                <v-icon small class="mr-1">mdi-source-branch-plus</v-icon>
                new branch
              </v-btn> -->

              <v-chip-group
                active-class="primary--text text--accent-1"
                mandatory
              >
                <v-chip small class="mb-3" active @click="newBranch">
                  <v-icon small class="mr-1">mdi-source-branch-plus</v-icon>
                  new branch
                </v-chip>
              </v-chip-group>
              <branch-dialog
                ref="branchDialog"
                :branches="branches"
              ></branch-dialog>

              <div class="clear"></div>

              <p
                v-if="branches[selectedBranch].description"
                class="subtitle-1 font-weight-light ml-4 mt-2"
              >
                {{ branches[selectedBranch].description }}
              </p>

              <v-btn
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
        <v-row>
          <v-col>
            <v-card rounded="lg" class="pa-5" elevation="0">
              <v-subheader class="text-uppercase">Commits:</v-subheader>

              <v-card-text>
                <p
                  v-if="branches[selectedBranch].commits.items.length === 0"
                  class="subtitle-1 font-weight-light"
                >
                  There are no commits in the
                  {{ branches[selectedBranch].name }} branch just yet, try
                  sending something...
                </p>

                <div
                  v-for="(commit, i) in branches[selectedBranch].commits.items"
                  :key="i"
                >
                  <list-item-commit
                    :commit="commit"
                    :stream-id="stream.id"
                  ></list-item-commit>
                  <v-divider
                    v-if="i < branches[selectedBranch].commits.items.length - 1"
                  ></v-divider>
                </div>
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
import BranchDialog from "../components/dialogs/BranchDialog"
import ListItemCommit from "../components/ListItemCommit"
import streamQuery from "../graphql/stream.gql"

export default {
  name: "Stream",
  components: { SidebarStream, BranchDialog, ListItemCommit },
  data: () => ({ selectedBranch: 0 }),
  apollo: {
    stream: {
      prefetch: true,
      query: streamQuery,
      variables() {
        // Use vue reactive properties here
        return {
          id: this.$route.params.id
        }
      }
    }
  },
  computed: {
    branches() {
      //reverse without changing original array
      return this.stream.branches.items.slice().reverse()
    }
  },
  watch: {
    stream(val) {
      console.log(val)
    }
  },
  methods: {
    newBranch() {
      this.$refs.branchDialog.open().then((dialog) => {
        if (!dialog.result) return
        console.log(dialog.result)
        this.$apollo
          .mutate({
            mutation: gql`
              mutation branchCreate($myBranch: BranchCreateInput!) {
                branchCreate(branch: $myBranch)
              }
            `,
            variables: {
              myBranch: {
                streamId: this.stream.id,
                ...dialog.branch
              }
            }
          })
          .then((data) => {
            // Result
            console.log(data)

            this.$apollo.queries.stream.refetch()
          })
          .catch((error) => {
            // Error
            console.error(error)
            // We restore the initial user input
            //this.newTag = newTag
          })
      })
    },
    editBranch() {
      this.$refs.branchDialog
        .open(this.branches[this.selectedBranch], this.stream.id)
        .then((dialog) => {
          if (!dialog.result) return

          //DELETE BRANCH
          if (dialog.delete) {
            this.$apollo
              .mutate({
                mutation: gql`
                  mutation branchDelete($myBranch: BranchDeleteInput!) {
                    branchDelete(branch: $myBranch)
                  }
                `,
                variables: {
                  myBranch: {
                    id: this.branches[this.selectedBranch].id,
                    streamId: this.stream.id
                  }
                }
              })
              .then((data) => {
                this.selectedBranch = 0
                this.$apollo.queries.stream.refetch()
              })
              .catch((error) => {
                // Error
                console.error(error)
              })

            return
          }

          //EDIT BRANCH
          this.$apollo
            .mutate({
              mutation: gql`
                mutation branchUpdate($myBranch: BranchUpdateInput!) {
                  branchUpdate(branch: $myBranch)
                }
              `,
              variables: {
                myBranch: { ...dialog.branch }
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
