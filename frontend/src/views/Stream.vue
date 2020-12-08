<template>
  <v-container>
    <v-row v-if="stream">
      <v-col sm="12" lg="3" md="4">
        <sidebar-stream :stream="stream"></sidebar-stream>
      </v-col>

      <!-- Description -->

      <v-col sm="12" lg="9" md="8">
        <v-row>
          <v-col cols="12" sm="12" lg="12">
            <v-card rounded="lg" class="pa-4" elevation="0" color="background2">
              <v-card-title>Description</v-card-title>
              <v-card-text>
                {{ stream.description }}
              </v-card-text>
            </v-card>
          </v-col>

          <!-- Branches -->

          <v-col cols="12" sm="12" lg="12">
            <v-card rounded="lg" class="pa-4" elevation="0" color="background2">
              <v-card-title>
                <v-icon class='mr-2'>mdi-source-branch</v-icon>
                Branches
              </v-card-title>
              <v-card-text>
                Branches allow you to manage parallel versions of data in a
                single stream, by organising them within a topic.
              </v-card-text>
              <v-card-text>
                <v-list two-line color="transparent">
                  <template v-for="item in branches">
                    <v-list-item
                      :key="item.id"
                      :to="`/streams/${stream.id}/branches/${item.name}`"
                    >
                      <v-list-item-content>
                        <v-list-item-title>
                          <b>{{ item.name }}</b>
                          &nbsp;
                          <v-chip outlined>
                            <v-avatar
                              size="10"
                              left
                              class="primary white--text"
                            >
                              {{ item.commits.totalCount }}
                            </v-avatar>
                            commits
                          </v-chip>
                        </v-list-item-title>
                        <v-list-item-subtitle>
                          {{
                            item.description
                              ? item.description
                              : "no description provided"
                          }}
                        </v-list-item-subtitle>
                      </v-list-item-content>
                    </v-list-item>
                  </template>
                </v-list>
                <v-btn block @click="newBranch">Create a new branch</v-btn>
                <branch-dialog
                  ref="branchDialog"
                  :branches="branches"
                ></branch-dialog>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- Commits -->

          <v-col cols="12" sm="12">
            <v-card rounded="lg" class="pa-4" elevation="0" color="background2">
              <v-card-title>
                Latest activity &nbsp;&nbsp;&nbsp;
                <span class="font-weight-light ml-2 body-1">
                  ({{ commits.totalCount }} total)
                </span>
              </v-card-title>
              <v-card-text>
                All the commits from this stream are below.
              </v-card-text>
              <v-card-text>
                <list-item-commit
                  v-for="item in commits.items"
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
import BranchDialog from "../components/dialogs/BranchDialog"
import ListItemCommit from "../components/ListItemCommit"
import streamQuery from "../graphql/stream.gql"
import streamCommitsQuery from "../graphql/streamCommits.gql"

export default {
  name: "Stream",
  components: { SidebarStream, BranchDialog, ListItemCommit },
  data() {
    return {
      selectedBranch: 0,
      stream: {
        id: null,
        branches: {
          totalCount: 0,
          items: []
        },
        commits: {
          totalCount: 0,
          items: []
        }
      },
      commits: {
        totalCount: 0,
        items: []
      }
    }
  },
  apollo: {
    stream: {
      prefetch: true,
      query: streamQuery,
      variables() {
        // Use vue reactive properties here
        return {
          id: this.$route.params.streamId
        }
      }
    },
    commits: {
      query: streamCommitsQuery,
      variables() {
        return {
          id: this.$route.params.streamId
        }
      },
      update: (data) => data.stream.commits
    }
  },
  computed: {
    branches() {
      //reverse without changing original array
      return this.stream.branches.items.slice().reverse()
    }
  },
  mounted() {
    this.$matomo && this.$matomo.trackPageView("streams/single")
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
