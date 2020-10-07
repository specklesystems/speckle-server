<template>
  <v-container>
    <v-row v-if="stream">
      <v-col cols="3">
        <sidebar-stream></sidebar-stream>
      </v-col>
      <v-col cols="9">
        <v-row>
          <v-col class="pt-0">
            <v-card class="pa-5" elevation="0" rounded="lg">
              <v-subheader class="text-uppercase">Branches:</v-subheader>

              <v-chip-group
                mandatory
                class="ml-3"
                active-class="primary--text text--accent-1"
              >
                <v-chip
                  v-for="(branch, i) in stream.branches.items"
                  :key="i"
                  class="mb-3"
                  small
                >
                  {{ branch.name }}
                </v-chip>
              </v-chip-group>

              <v-chip-group
                active-class="primary--text text--accent-1"
                mandatory
              >
                <v-chip small class="mb-3" active @click="newBranch">
                  <v-icon small class="mr-1">mdi-source-branch-plus</v-icon>
                  new branch
                </v-chip>
              </v-chip-group>
              <new-branch ref="newBranchDialog"></new-branch>

              <div class="clear"></div>
            </v-card>
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <v-card rounded="lg" class="pa-5" elevation="0">
              <v-subheader class="text-uppercase">Commits:</v-subheader>
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
import NewBranch from "../components/dialogs/NewBranch"
import streamQuery from "../graphql/stream.gql"

export default {
  name: "Stream",
  components: { SidebarStream, NewBranch },
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
  data: () => ({}),
  watch: {
    stream(val) {
      console.log(val)
    }
  },
  methods: {
    newBranch() {
      this.$refs.newBranchDialog.open().then((dialog) => {
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
                name: dialog.name,
                description: dialog.description
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
    }
  }
}
</script>
<style scoped>
.streamid {
  font-family: monospace !important;
}

a {
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

.v-item-group {
  float: left;
}

.clear {
  clear: both;
}
</style>
