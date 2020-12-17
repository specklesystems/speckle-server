<template>
  <v-container>
    <v-row v-if="$apollo.loading">
      <v-skeleton-loader type="card, article"></v-skeleton-loader>
      <v-skeleton-loader type="card, article"></v-skeleton-loader>
    </v-row>
    <v-row v-if="stream">
      <v-col cols="12" sm="12" md="4" lg="3" xl="2">
        <sidebar-stream :stream="stream" :user-role="userRole"></sidebar-stream>
      </v-col>
      <v-col cols="12" sm="12" md="8" lg="9" xl="10">
        <router-view :stream="stream" :user-role="userRole"></router-view>
      </v-col>
    </v-row>
  </v-container>
</template>
<script>
import SidebarStream from "../components/SidebarStream"
import streamQuery from "../graphql/stream.gql"
import streamCommitsQuery from "../graphql/streamCommits.gql"

export default {
  name: "Stream",
  components: {
    SidebarStream
  },
  data() {
    return {
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
      let uuid = localStorage.getItem("uuid")
      if (!uuid) return null
      if (this.$apollo.loading) return null
      let contrib = this.stream.collaborators.find((u) => u.id === uuid)
      if (contrib) return contrib.role.split(":")[1]
      else return null
    }
  },
  mounted() {},
  methods: {}
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
