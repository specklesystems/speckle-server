<template>
  <v-container v-if="error">
    <v-card>
      <v-card-title>Something went wrong.</v-card-title>
    </v-card>
  </v-container>
  <v-container v-else>
    <v-row v-if="$apollo.loading">
      <v-col cols="12" sm="12" md="4" lg="3" xl="2">
        <v-skeleton-loader type="card, article"></v-skeleton-loader>
      </v-col>
      <v-col cols="12" sm="12" md="8" lg="9" xl="7">
        <v-skeleton-loader type="article, article"></v-skeleton-loader>
      </v-col>
    </v-row>
    <v-row v-if="stream">
      <v-col cols="12" sm="12" md="4" lg="3" xl="2">
        <sidebar-stream :stream="stream" :user-role="userRole" @refresh="refresh"></sidebar-stream>
      </v-col>
      <v-col cols="12" sm="12" md="8" lg="9" xl="7">
        <router-view :stream="stream" :user-role="userRole"></router-view>
      </v-col>
    </v-row>
  </v-container>
</template>
<script>
import SidebarStream from '../components/SidebarStream'
import streamQuery from '../graphql/stream.gql'
import streamCommitsQuery from '../graphql/streamCommits.gql'

export default {
  name: 'Stream',
  components: {
    SidebarStream
  },
  data() {
    return {
      error: null,
      dialogDescription: false,
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
        return {
          id: this.$route.params.streamId
        }
      },
      error(error) {
        this.$router.push({ path: '/error' })
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
    userRole() {
      let uuid = localStorage.getItem('uuid')
      if (!uuid) return null
      if (this.$apollo.loading) return null
      let contrib = this.stream.collaborators.find((u) => u.id === uuid)
      if (contrib) return contrib.role.split(':')[1]
      else return null
    }
  },
  methods: {
    refresh() {
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
