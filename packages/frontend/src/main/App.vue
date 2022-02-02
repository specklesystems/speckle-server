<template lang="html">
  <router-view></router-view>
</template>
<script>
import gql from 'graphql-tag'

export default {
  components: {},
  apollo: {
    serverInfo: {
      query: gql`
        query {
          serverInfo {
            name
            company
            description
            adminContact
          }
        }
      `
    }
  }
}
</script>
<style lang="css">
.v-timeline:before {
  top: 40px !important;
}
</style>
