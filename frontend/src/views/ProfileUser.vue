<template>
  <v-container>
    <v-row>TODO (Profile User {{ $route.params.userId }})</v-row>
  </v-container>
</template>
<script>
import gql from "graphql-tag"

export default {
  name: "ProfileUser",
  components: {},
  data: () => ({}),
  apollo: {},
  computed: {},
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
