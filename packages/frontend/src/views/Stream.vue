<template>
  <v-container>
    <v-row v-if="stream">
      <v-col cols="12" sm="12" md="4" lg="3" xl="2">
        <sidebar-stream :user-role="userRole"></sidebar-stream>
      </v-col>
      <v-col cols="12" sm="12" md="8" lg="9" xl="7" class="pt-10">
        <router-view :user-role="userRole"></router-view>
      </v-col>
    </v-row>
  </v-container>
</template>
<script>
import SidebarStream from '../components/SidebarStream'
import streamQuery from '../graphql/stream.gql'

export default {
  name: 'Stream',
  components: {
    SidebarStream
  },
  data() {
    return {}
  },
  apollo: {
    stream: {
      query: streamQuery,
      variables() {
        return {
          id: this.$route.params.streamId
        }
      },
      error(err) {
        this.$router.push({ path: `/error?message=${err.message}` })
      }
    }
  },
  computed: {
    userRole() {
      let uuid = localStorage.getItem('uuid')
      if (!uuid) return null
      if (this.$apollo.loading) return null
      let contrib = this.stream.collaborators.find((u) => u.id === uuid)
      if (contrib) return contrib.role.split(':')[1]
      else return null
    }
  }
}
</script>
