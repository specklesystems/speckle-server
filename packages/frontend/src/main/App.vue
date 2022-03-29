<template lang="html">
  <router-view></router-view>
</template>
<script>
import { MainServerInfoQuery } from '@/graphql/server'

export default {
  components: {},
  apollo: {
    serverInfo: {
      query: MainServerInfoQuery
    }
  }
}
</script>
<style lang="css">
.v-timeline:before {
  top: 40px !important;
}
</style>
