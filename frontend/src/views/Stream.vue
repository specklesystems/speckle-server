<template>
  <v-sheet v-if="stream" rounded="lg" class="pa-15 text-center">
    <h1>{{ stream.name }}</h1>
    <p class="ma-10 subtitle-1 font-weight-light">{{ stream.description }}</p>
  </v-sheet>
</template>
<script>
import streamQuery from "../graphql/stream.gql"

export default {
  name: "Stream",
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
