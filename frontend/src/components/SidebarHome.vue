<template>
  <div>
    <v-sheet rounded="lg" class="pa-4 text-center">
      <v-avatar class="mb-4" color="grey lighten-3" size="64">
        <v-img v-if="user.avatar" :src="user.avatar" />
        <v-img
          v-else
          :src="`https://robohash.org/` + user.id + `.png?size=64x64`"
        />
      </v-avatar>
      <div>
        <strong>{{ user.name }}</strong>
      </div>
      <div>{{ user.company }}</div>
      <code>{{ user.id }}</code>
    </v-sheet>

    <v-sheet rounded="lg" class="mt-5 pa-4 text-center">
      <div>
        <strong>{{ serverInfo.name }}</strong>
      </div>
      <div>{{ serverInfo.company }}</div>
      <div>{{ serverInfo.description }}</div>
      <div v-if="serverInfo.adminContact">
        {{ serverInfo.adminContact }}
      </div>
      <code v-if="serverInfo.canonicalUrl">
        {{ serverInfo.canonicalUrl }}
      </code>
    </v-sheet>
  </div>
</template>
<script>
import userQuery from "../graphql/user.gql"
import serverQuery from "../graphql/server.gql"

export default {
  data: () => ({ user: {}, serverInfo: {} }),
  apollo: {
    user: {
      prefetch: true,
      query: userQuery
    },
    serverInfo: {
      prefetch: true,
      query: serverQuery
    }
  }
}
</script>
