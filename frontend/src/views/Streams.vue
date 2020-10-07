<template>
  <v-container>
    <v-row>
      <v-col cols="3">
        <sidebar-home></sidebar-home>
      </v-col>
      <v-col cols="9">
        <v-card rounded="lg" class="pa-5" elevation="0">
          <v-card-title>Your Streams</v-card-title>
          <v-card-text v-if="user.streams && user.streams.items">
            <div v-for="(stream, i) in user.streams.items" :key="i">
              <stream-box :stream="stream"></stream-box>
              <v-divider v-if="i < user.streams.items.length - 1"></v-divider>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
<script>
import StreamBox from "../components/StreamBox"
import SidebarHome from "../components/SidebarHome"
import userQuery from "../graphql/user.gql"

export default {
  name: "Streams",
  components: { StreamBox, SidebarHome },
  apollo: {
    user: {
      prefetch: true,
      query: userQuery
    }
  },
  data: () => ({})
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
