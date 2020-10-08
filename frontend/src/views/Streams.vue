<template>
  <v-container>
    <v-row>
      <v-col cols="3">
        <sidebar-home></sidebar-home>
      </v-col>
      <v-col v-if="user" cols="9">
        <v-card rounded="lg" class="pa-5" elevation="0">
          <v-card-title>Your Streams</v-card-title>
          <v-btn
            class="ml-3 mt-5 text-right"
            color="primary"
            elevation="0"
            small
            @click="newStream"
          >
            <v-icon small class="mr-1">mdi-plus-box-outline</v-icon>
            new stream
          </v-btn>

          <stream-dialog ref="newStreamDialog"></stream-dialog>

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
import gql from "graphql-tag"
import StreamBox from "../components/StreamBox"
import SidebarHome from "../components/SidebarHome"
import StreamDialog from "../components/dialogs/StreamDialog"
import userQuery from "../graphql/user.gql"

export default {
  name: "Streams",
  components: { StreamBox, SidebarHome, StreamDialog },
  apollo: {
    user: {
      prefetch: true,
      query: userQuery
    }
  },
  data: () => ({}),
  methods: {
    newStream() {
      this.$refs.newStreamDialog.open().then((dialog) => {
        if (!dialog.result) return
        console.log(dialog)
        this.$apollo
          .mutate({
            mutation: gql`
              mutation streamCreate($myStream: StreamCreateInput!) {
                streamCreate(stream: $myStream)
              }
            `,
            variables: {
              myStream: {
                name: dialog.stream.name,
                description: dialog.stream.description,
                isPublic: dialog.stream.isPublic
              }
            }
          })
          .then((data) => {
            // Result
            console.log(data)

            this.$apollo.queries.user.refetch()
          })
          .catch((error) => {
            // Error
            console.error(error)
          })
      })
    }
  }
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
