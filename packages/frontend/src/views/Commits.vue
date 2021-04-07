<template>
  <div>
    <v-row>
      <v-col v-if="$apollo.loading">
        <v-skeleton-loader type="article, article"></v-skeleton-loader>
      </v-col>
      <v-col v-else-if="stream.branch" cols="12">
        <v-card class="pa-4" elevation="0" rounded="lg">
          <v-dialog v-model="dialogEdit" max-width="500">
            <branch-edit-dialog :branch="stream.branch" @close="closeEdit" />
          </v-dialog>
          <v-card-title class="mr-8">
            <v-icon class="mr-2">mdi-source-branch</v-icon>
            <span class="d-inline-block">{{ stream.branch.name }}</span>
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

        <v-card class="mt-5 pa-4" elevation="0" rounded="lg">
          <v-subheader class="text-uppercase">
            Commits ({{ stream.branch.commits.totalCount }})
          </v-subheader>
          <no-data-placeholder
            v-if="stream.branch.commits.totalCount === 0"
            :name="stream.branch.name"
          />

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
    <v-row v-if="!$apollo.loading && !stream.branch" justify="center">
      <v-col cols="12" class="pt-10">
        <error-block :message="'Branch ' + $route.params.branchName + ' does not exist'" />
      </v-col>
    </v-row>
  </div>
</template>
<script>
import gql from 'graphql-tag'
import branchQuery from '../graphql/branch.gql'
import ListItemCommit from '../components/ListItemCommit'
import BranchEditDialog from '../components/dialogs/BranchEditDialog'
import NoDataPlaceholder from '../components/NoDataPlaceholder'
import ErrorBlock from '../components/ErrorBlock'

export default {
  name: 'Branch',
  components: { ListItemCommit, BranchEditDialog, NoDataPlaceholder, ErrorBlock },
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
          path: `/streams/${this.streamId}/branches/${encodeURIComponent(name)}/commits`
        })
        return
      }
      this.$apollo.queries.stream.refetch()
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
