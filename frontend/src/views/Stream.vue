<template>
  <v-container>
    <v-row>
      <v-col cols="3">
        <sidebar-stream></sidebar-stream>
      </v-col>
      <v-col cols="9">
        <v-card v-if="stream" rounded="lg" class="pa-5" elevation="0">
          <v-card-title>{{ stream.name }}</v-card-title>
          <v-card-text>
            <p class="subtitle-1 font-weight-light">{{ stream.description }}</p>

            <div class="mt-1 mr-4">
              <span class="streamid">
                <router-link :to="'streams/' + stream.id">
                  {{ stream.id }}
                </router-link>
              </span>
              <v-icon small>mdi-key-outline</v-icon>
              <span class="ma-2"></span>
              <span>
                {{ stream.branches.totalCount }}
              </span>
              <v-icon small>mdi-source-branch</v-icon>
              <span class="ma-2"></span>
              <span>
                {{ stream.commits.totalCount }}
              </span>
              <v-icon small>mdi-cube-outline</v-icon>
              <span class="ma-2"></span>
              <span>{{ stream.collaborators.length }}</span>
              <v-icon small>mdi-account-outline</v-icon>
              <span class="ma-2"></span>
              <v-icon v-if="stream.isPublic" small>mdi-lock-open</v-icon>
              <v-icon v-else small>mdi-lock-outline</v-icon>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
<script>
import SidebarStream from "../components/SidebarStream"
import streamQuery from "../graphql/stream.gql"

export default {
  name: "Stream",
  components: { SidebarStream },
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
  }
}
</script>
<style>
.streamid {
  font-family: monospace !important;
}

a {
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}
</style>
