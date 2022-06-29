<template lang="html">
  <router-view></router-view>
</template>
<script>
import { mainServerInfoQuery } from '@/graphql/server'

export default {
  components: {},
  apollo: {
    serverInfo: {
      query: mainServerInfoQuery
    }
  }
}
</script>
<style lang="css">
.v-timeline:before {
  top: 40px !important;
}
</style>
