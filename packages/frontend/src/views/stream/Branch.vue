<template>
  <div>
    <v-row>
      <v-col v-if="$apollo.loading">
        <v-skeleton-loader type="article, article"></v-skeleton-loader>
      </v-col>
      <v-col v-else-if="stream.branch" cols="12">
        <breadcrumb-title />
        <h3 v-if="stream.branch.description" class="title font-italic font-weight-thin my-5">
          {{ stream.branch.descrption }}
        </h3>

        <v-card class="mt-5 pa-4" elevation="0" rounded="lg">
          <branch-edit-dialog ref="editBranchDialog" />

          <v-card-title>
            <v-icon class="mr-2">mdi-source-branch</v-icon>
            <span class="d-inline-block">{{ stream.branch.name }}</span>
            <v-spacer />
            <v-btn
              v-if="stream.role === 'stream:contributor' || stream.role === 'stream:owner'"
              color="primary"
              class="my-2"
              small
              @click="editBranch"
            >
              <v-icon small class="mr-2 float-left">mdi-cog-outline</v-icon>
              Edit branch
            </v-btn>
          </v-card-title>
          <v-subheader class="text-uppercase">
            Commits ({{ stream.branch.commits.totalCount }})
          </v-subheader>

          <v-card-text>
            <list-item-commit
              v-for="item in stream.branch.commits.items"
              :key="item.id"
              :commit="item"
              :stream-id="streamId"
            ></list-item-commit>
          </v-card-text>
        </v-card>

        <no-data-placeholder
          v-if="stream.branch.commits.totalCount === 0"
          :message="'This Branch has no commits yet.'"
        />
      </v-col>
    </v-row>
    <v-row v-if="!$apollo.loading && !stream.branch" justify="center">
      <v-col cols="12" class="pt-10">
        <error-block :message="'Branch ' + $route.params.branchName + ' does not exist'" />
      </v-col>
    </v-row>
  </div>
</template>
<script>
import gql from 'graphql-tag'
import branchQuery from '@/graphql/branch.gql'

export default {
  name: 'Branch',
  components: {
    ListItemCommit: () => import('@/components/ListItemCommit'),
    BranchEditDialog: () => import('@/components/dialogs/BranchEditDialog'),
    NoDataPlaceholder: () => import('@/components/NoDataPlaceholder'),
    ErrorBlock: () => import('@/components/ErrorBlock'),
    BreadcrumbTitle: () => import('@/components/BreadcrumbTitle')
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
          streamId: this.streamId,
          branchName: this.$route.params.branchName
        }
      }
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
        }
      }
    }
  },
  computed: {
    streamId() {
      return this.$route.params.streamId
    }
  },
  methods: {
    editBranch() {
      this.$refs.editBranchDialog.open(this.stream.branch).then((dialog) => {
        if (!dialog.result) return
        else if (dialog.deleted) {
          this.$router.push({ path: `/streams/${this.streamId}` })
        } else if (dialog.name !== this.$route.params.branchName) {
          //this.$router.push does not work, refresh entire window

          this.$router.push({
            path: `/streams/${this.streamId}/branches/${encodeURIComponent(dialog.name)}`
          })
        } else {
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
