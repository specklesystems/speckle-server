<template>
  <v-card rounded="lg" class="pa-4" elevation="0" color="transparent">
    <div v-if="!stream">
      <v-skeleton-loader type="card, article, article"></v-skeleton-loader>
    </div>
    <div v-if="stream">
      <v-card-title class="mr-8">
        <router-link v-show="!isHomeRoute" :to="'/streams/' + stream.id">
          {{ stream.name }}
        </router-link>
        <div v-show="isHomeRoute">
          {{ stream.name }}
        </div>
      </v-card-title>
      <v-divider></v-divider>
      <v-card-text>
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
          <span v-if="stream.isPublic">
            <v-icon small>mdi-link</v-icon>
            link sharing on
          </span>
          <span v-else>
            <v-icon small>mdi-link-lock</v-icon>
            link sharing off
          </span>
        </p>
        <p>
          Created
          <timeago :datetime="stream.createdAt"></timeago>
        </p>
        <p>
          Updated
          <timeago :datetime="stream.updatedAt"></timeago>
        </p>
        <v-btn
          v-if="canEdit"
          small
          outlined
          text

          color=""
          @click="editStream"
        >
          Edit
          <v-icon small class="ml-3">mdi-cog-outline</v-icon>
        </v-btn>
        <stream-dialog ref="streamDialog"></stream-dialog>
      </v-card-text>

      <v-card-title><h5>Collaborators</h5></v-card-title>
      <v-card-text>
        <v-row v-for="(collab, i) in stream.collaborators" :key="i">
          <v-col sm="3">
            <user-avatar
              :id="collab.id"
              :size="40"
              :avatar="collab.avatar"
              :name="collab.name"
            ></user-avatar>
          </v-col>
          <v-col>
            <span class="text-body-2">{{ collab.name }}</span>
            <br />
            <span class="caption">{{ collab.role.split(":")[1] }}</span>
          </v-col>
        </v-row>
        <v-btn
          v-if="canEdit"
          small
          outlined
          text
          
          color=""
          class="mt-3"
          @click="shareStream"
        >
          Manage
          <v-icon small class="ml-3">mdi-account-multiple</v-icon>
        </v-btn>
        <v-dialog v-model="dialogShare">
          <h1>WIP</h1>
        </v-dialog>
        <!--         <stream-share-dialog
          v-if="stream"
          ref="streamShareDialog"
          :users="stream.collaborators"
          :stream-id="stream.id"
          :user-id="userId"
        ></stream-share-dialog> -->
      </v-card-text>
    </div>
  </v-card>
</template>
<script>
import gql from "graphql-tag"
import StreamDialog from "../components/dialogs/StreamDialog"
import StreamShareDialog from "../components/dialogs/StreamShareDialog"
import UserAvatar from "../components/UserAvatar"

export default {
  components: {
    StreamDialog,
    StreamShareDialog,
    UserAvatar
  },
  props: {
    stream: {
      type: Object,
      default: () => null
    }
  },
  apollo: {},
  data: () => ({
    dialogShare: false
  }),
  computed: {
    isHomeRoute() {
      return this.$route.name === "stream"
    },
    canEdit() {
      return true
    },
    userId() {
      return localStorage.getItem("uuid")
    }
  },
  methods: {
    shareStream() {
      this.dialogShare = true
    },
    editStream() {
      this.$refs.streamDialog.open(this.stream).then((dialog) => {
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
              this.$router.push({
                name: "streams"
              })
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
