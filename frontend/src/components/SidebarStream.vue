<template>
  <div v-if="stream">
    <v-card rounded="lg" class="pa-4" elevation="0">
      <v-card-title class="mr-8">
        {{ stream.name }}
      </v-card-title>
      <v-btn
        small
        icon
        style="position: absolute; right: 15px; top: 15px"
        @click="editStream"
      >
        <v-icon small>mdi-pencil-outline</v-icon>
      </v-btn>

      <stream-dialog ref="editStreamDialog"></stream-dialog>

      <v-card-text>
        <p class="subtitle-1 font-weight-light">{{ stream.description }}</p>

        <p>
          <v-icon small>mdi-key-outline</v-icon>
          &nbsp;
          <span class="streamid">
            <router-link :to="'/streams/' + stream.id">
              {{ stream.id }}
            </router-link>
          </span>
        </p>
        <p>
          <v-icon small>mdi-source-branch</v-icon>
          &nbsp;
          <span>
            {{ stream.branches.totalCount }}
            branch{{ stream.branches.totalCount === 1 ? "" : "es" }}
          </span>
        </p>
        <p>
          <v-icon small>mdi-history</v-icon>
          &nbsp;
          <span>
            {{ stream.commits.totalCount }}
            commit{{ stream.commits.totalCount === 1 ? "" : "s" }}
          </span>
        </p>
        <p>
          <v-icon small>mdi-account-outline</v-icon>
          &nbsp;
          <span>{{ stream.collaborators.length }}</span>
          collaborator{{ stream.collaborators.length === 1 ? "" : "s" }}
        </p>
        <p>
          <span v-if="stream.isPublic">
            <v-icon small>mdi-lock-open</v-icon>
            link sharing on
          </span>
          <span v-else>
            <v-icon small>mdi-lock-outline</v-icon>
            link sharing off
          </span>
        </p>
      </v-card-text>
    </v-card>

    <v-card rounded="lg" class="mt-5 pa-4" elevation="0">
      <v-card-title class="subtitle-1">Collaborators</v-card-title>
      <v-card-actions class="ml-2 mr-2">
        <v-btn small fab color="primary" class="ma-1" elevation="0">
          <v-icon small>mdi-account-multiple-plus</v-icon>
        </v-btn>
        <v-avatar
          v-for="(collab, i) in stream.collaborators"
          :key="i"
          class="ma-1"
          color="grey lighten-3"
          size="40"
        >
          <v-img v-if="collab.avatar" :src="collab.avatar" />
          <v-img
            v-else
            :src="`https://robohash.org/` + collab.id + `.png?size=40x40`"
          />
        </v-avatar>
      </v-card-actions>
    </v-card>
  </div>
</template>
<script>
import gql from "graphql-tag"
import streamQuery from "../graphql/stream.gql"
import StreamDialog from "../components/dialogs/StreamDialog"

export default {
  components: { StreamDialog },
  props: ["stream"],
  data: () => ({}),
  methods: {
    editStream() {
      this.$refs.editStreamDialog.open(this.stream).then((dialog) => {
        if (!dialog.result) return

        //DELETE STREAM
        if (dialog.delete) {
          this.$apollo
            .mutate({
              mutation: gql`
                mutation streamDelete($id: String!) {
                  streamDelete(id: $id)
                }
              `,
              variables: {
                id: this.stream.id
              }
            })
            .then((data) => {
              this.$router.push({ name: "streams" })
            })
            .catch((error) => {
              // Error
              console.error(error)
            })

          return
        }

        //EDIT STREAM
        this.$apollo
          .mutate({
            mutation: gql`
              mutation streamUpdate($myStream: StreamUpdateInput!) {
                streamUpdate(stream: $myStream)
              }
            `,
            variables: {
              myStream: { ...dialog.stream }
              //isPublic: dialog.stream.isPublic //TODO: this is not working https://github.com/specklesystems/Server/issues/30
            }
          })
          .then((data) => {
            this.$apollo.queries.stream.refetch()
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
