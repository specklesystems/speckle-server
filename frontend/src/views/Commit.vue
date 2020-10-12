<template>
  <v-container>
    <v-row v-if="stream">
      <v-col cols="3">
        <sidebar-stream :stream="stream"></sidebar-stream>
      </v-col>
      <v-col cols="9">
        <v-row>
          <v-col class="pt-0">
            <v-card class="pa-5" elevation="0" rounded="lg">
              <!-- <v-card-title class="mr-8">
                {{ commit.message }}
              </v-card-title> -->
              <!-- TODO need an endpoint to get a commit by ID
               -->
              <v-subheader class="text-uppercase">WORK IN PROGRESS</v-subheader>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>
<script>
import SidebarStream from "../components/SidebarStream"
import streamQuery from "../graphql/stream.gql"

export default {
  name: "Commit",
  components: { SidebarStream },
  data: () => ({ selectedBranch: 0 }),
  apollo: {
    stream: {
      prefetch: true,
      query: streamQuery,
      variables() {
        // Use vue reactive properties here
        return {
          id: this.$route.params.streamid
        }
      }
    }
    // commit: {
    //   prefetch: true,
    //   query: streamQuery,
    //   variables() {
    //     // Use vue reactive properties here
    //     return {
    //       id: this.$route.params.id
    //     }
    //   }
    // }
  },
  computed: {},
  watch: {
    stream(val) {
      console.log(val)
    }
  }
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
