<template>
  <v-row>
    <v-col v-if="!stream || $apollo.loading" cols="12">
      <v-skeleton-loader type="article, article"></v-skeleton-loader>
    </v-col>
    <v-col v-else sm="12">
      <v-card rounded="lg" class="pa-4 mb-4" elevation="0" color="background2">
        <v-card-title v-if="!stream.description">Description</v-card-title>
        <v-card-text v-if="!stream.description">
          No description provided.
        </v-card-text>
        <v-card-text
          v-if="stream.description"
          class="marked-preview"
          v-html="compiledStreamDescription"
        ></v-card-text>
        <v-card-actions v-if="userRole === 'owner'">
          <v-btn small @click="dialogDescription = true">
            Edit Description
          </v-btn>
          <v-dialog v-model="dialogDescription">
            <stream-description-dialog
              :id="stream.id"
              :description="stream.description"
              @close="closeDescription"
            />
          </v-dialog>
        </v-card-actions>
      </v-card>

      <v-card rounded="lg" class="pa-4 mb-4" elevation="0" color="background2">
        <v-card-title>
          <v-icon class="mr-2">mdi-source-branch</v-icon>
          Branches
        </v-card-title>
        <v-card-text>
          Branches allow you to manage parallel versions of data in a single
          stream, by organising them within a topic.
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
                  </v-list-item-title>
                  <v-list-item-subtitle>
                    {{
                      item.description
                        ? item.description
                        : "no description provided"
                    }}
                  </v-list-item-subtitle>
                </v-list-item-content>
                <v-list-item-action>
                  <v-chip small>
                    {{ item.commits.totalCount }}
                    commits
                  </v-chip>
                </v-list-item-action>
              </v-list-item>
            </template>
          </v-list>
          <v-btn
            v-if="userRole === 'contributor' || userRole === 'owner'"
            small
            @click="newBranch"
          >
            new branch
          </v-btn>
          <branch-dialog
            ref="branchDialog"
            :branches="branches"
          ></branch-dialog>
        </v-card-text>
      </v-card>

      <v-card rounded="lg" class="pa-4 mb-4" elevation="0" color="background2">
        <v-card-title>
          Latest activity &nbsp;&nbsp;&nbsp;
          <span class="font-weight-light ml-2 body-1">
            ({{ commits.totalCount }} total)
          </span>
        </v-card-title>
        <v-card-text>All the commits from this stream are below.</v-card-text>
        <v-card-text v-if="stream.commits">
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
</template>
<script>
import marked from "marked"
import DOMPurify from "dompurify"
import gql from "graphql-tag"
import BranchDialog from "../components/dialogs/BranchDialog"
import StreamDescriptionDialog from "../components/dialogs/StreamDescriptionDialog"
import ListItemCommit from "../components/ListItemCommit"
import streamCommitsQuery from "../graphql/streamCommits.gql"

export default {
  name: "StreamMain",
  components: {
    BranchDialog,
    ListItemCommit,
    StreamDescriptionDialog
  },
  props: {
    stream: {
      type: Object,
      default: () => null
    },
    userRole: {
      type: String,
      default: null
    }
  },
  data() {
    return {
      dialogDescription: false,
      selectedBranch: 0
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
    }
  },
  computed: {
    compiledStreamDescription() {
      if (!this.stream.description) return ""
      let md = marked(this.stream.description)
      return DOMPurify.sanitize(md)
    },
    branches() {
      //reverse without changing original array
      return this.stream.branches.items.slice().reverse()
    }
  },
  mounted() {
    this.$matomo && this.$matomo.trackPageView("streams/single")
  },
  methods: {
    closeDescription(newDescription) {
      this.stream.description = newDescription
      this.dialogDescription = false
    },
    newBranch() {
      this.$refs.branchDialog.open().then((dialog) => {
        if (!dialog.result) return
        
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
