<template>
  <div v-if="stream">
    <v-card rounded="lg" class="pa-4" elevation="0" color="background2">
      <v-card-title class="mr-8">
        {{ stream.name }}
      </v-card-title>
      <v-btn
        v-tooltip="'Edit stream details'"
        small
        icon
        style="position: absolute; right: 15px; top: 15px"
        @click="editStream"
      >
        <v-icon small>mdi-pencil-outline</v-icon>
      </v-btn>

      <stream-dialog ref="streamDialog"></stream-dialog>

      <v-card-text>
        <p class="subtitle-1 font-weight-light">{{ stream.description }}</p>

        <p>
          <btn-click-copy :text="stream.id"></btn-click-copy>
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
      </v-card-text>
    </v-card>

    <v-card rounded="lg" class="mt-5 pa-4" elevation="0" color="background2">
      <v-card-title class="subtitle-1">Collaborators</v-card-title>
      <div class="ml-2 mr-2">
        <v-btn
          v-if="isStreamOwner"
          v-tooltip="'Manage collaborators'"
          small
          fab
          color="primary"
          class="ma-1"
          elevation="0"
          @click="shareStream"
        >
          <v-icon small>mdi-account-multiple-plus</v-icon>
        </v-btn>
        <stream-share-dialog
          ref="streamShareDialog"
          :users="stream.collaborators"
          :stream-id="stream.id"
          :user-id="user.id"
        ></stream-share-dialog>

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
      </div>
    </v-card>
  </div>
</template>
<script>
import gql from "graphql-tag"
import streamQuery from "../graphql/stream.gql"
import StreamDialog from "../components/dialogs/StreamDialog"
import StreamShareDialog from "../components/dialogs/StreamShareDialog"
import BtnClickCopy from "./BtnClickCopy"

export default {
  components: { StreamDialog, StreamShareDialog, BtnClickCopy },
  apollo: {
    stream: {
      prefetch: true,
      query: streamQuery,
      variables() {
        // Use vue reactive properties here
        return {
          id: this.$route.params.streamId
        }
      }
    },
    user: {
      prefetch: true,
      query: gql`
        query {
          user {
            id
          }
        }
      `
    }
  },
  data: () => ({ user: {} }),
  computed: {
    isStreamOwner() {
      return (
        this.stream.collaborators.filter(
          (x) => x.id === this.user.id && x.role === "stream:owner"
        ).length > 0
      )
    }
  },
  watch: {
    user(val) {
      //console.log(val)
    }
  },
  methods: {
    shareStream() {
      this.$refs.streamShareDialog.open()
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
