<template>
  <v-container>
    <v-row v-if="stream">
      <v-col sm="12" lg="3" md="4">
        <sidebar-stream :stream="stream" :can-edit="canEdit"></sidebar-stream>
      </v-col>
      <v-col sm="12" lg="9" md="8">
        <router-view :stream="stream"></router-view>
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
    canEdit() {
      if (!this.stream.collaborators) return false
      let uuid = localStorage.getItem("uuid")
      let contrib = this.stream.collaborators.find(
        (u) => u.id === uuid && u.role === "stream:owner"
      )
      if (contrib) return true
      return false
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
