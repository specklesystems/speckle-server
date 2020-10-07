<template>
  <div>
    <v-card v-if="stream.id" rounded="lg" class="pa-4" elevation="0">
      <v-card-title>{{ stream.name }}</v-card-title>
      <v-card-text>
        <p class="subtitle-1 font-weight-light">{{ stream.description }}</p>

        <p>
          <v-icon small>mdi-key-outline</v-icon>
          &nbsp;
          <span class="streamid">
            <router-link :to="'streams/' + stream.id">
              {{ stream.id }}
            </router-link>
          </span>
        </p>
        <p>
          <v-icon small>mdi-source-branch</v-icon>
          &nbsp;
          <span>
            {{ stream.branches.totalCount }}
            branch{{ stream.branches.totalCount === 1 ? "" : "es" }}
          </span>
        </p>
        <p>
          <v-icon small>mdi-cube-outline</v-icon>
          &nbsp;
          <span>
            {{ stream.commits.totalCount }}
            commit{{ stream.commits.totalCount === 1 ? "" : "s" }}
          </span>
        </p>
        <p>
          <v-icon small>mdi-account-outline</v-icon>
          &nbsp;
          <span>{{ stream.collaborators.length - 1 }}</span>
          collaborator{{ stream.collaborators.length - 1 === 1 ? "" : "s" }}
        </p>
        <p>
          <span v-if="stream.isPublic">
            <v-icon small>mdi-lock-open</v-icon>
            public via link
          </span>
          <span v-else>
            <v-icon small>mdi-lock-outline</v-icon>
            private
          </span>
        </p>
      </v-card-text>
    </v-card>
  </div>
</template>
<script>
import streamQuery from "../graphql/stream.gql"

export default {
  data: () => ({ stream: {} }),
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
  }
}
</script>
