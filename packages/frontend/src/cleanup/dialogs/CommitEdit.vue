<template>
  <v-card :loading="loading">
    <template slot="progress">
      <v-progress-linear indeterminate></v-progress-linear>
    </template>
    <v-toolbar color="primary" dark flat>
      <v-app-bar-nav-icon style="pointer-events: none">
        <v-icon>mdi-pencil</v-icon>
      </v-app-bar-nav-icon>
      <v-toolbar-title>Edit Commit</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon @click="$emit('close')"><v-icon>mdi-close</v-icon></v-btn>
    </v-toolbar>
    <v-form ref="form" v-model="valid" lazy-validation @submit.prevent="editCommit()">
      <v-card-text class="pl-2 pr-2 pt-0 pb-0">
        <v-container>
          <v-row>
            <v-col cols="12" class="pb-0">
              <v-text-field
                v-model="commit.message"
                label="Message"
                :rules="nameRules"
                required
                autofocus
              ></v-text-field>
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>
      <v-card-actions>
        <v-btn text color="error" class="aligh: left" @click="showDeleteDialog = true">
          <v-icon small>mdi-delete</v-icon>
          <span class="ml-2">Delete</span>
        </v-btn>
        <v-spacer></v-spacer>
        <v-btn text @click="$emit('close')">Cancel</v-btn>
        <v-btn :disabled="!valid" color="primary" type="submit">Save</v-btn>
      </v-card-actions>
    </v-form>
    <v-dialog v-model="showDeleteDialog" width="500">
      <v-card class="pa-0" :loading="loading">
        <template slot="progress">
          <v-progress-linear indeterminate></v-progress-linear>
        </template>
        <v-toolbar color="error" dark flat>
          <v-app-bar-nav-icon style="pointer-events: none">
            <v-icon>mdi-pencil</v-icon>
          </v-app-bar-nav-icon>
          <v-toolbar-title>Delete Commit</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon @click="showDeleteDialog = false"><v-icon>mdi-close</v-icon></v-btn>
        </v-toolbar>
        <v-card-text class="mt-4">
          You cannot undo this action. This will permanently delete this commit. To confirm, type in
          its its id (
          <code>{{ commit.id }}</code>
          ) below:
          <v-text-field
            v-model="commitIdConfirmation"
            label="Confirm commit id"
            required
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="showDeleteDialog = false">Cancel</v-btn>
          <v-btn
            text
            class="error"
            :disabled="commitIdConfirmation !== commit.id"
            @click="deleteCommit()"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>
<script>
import gql from 'graphql-tag'
export default {
  props: ['stream'],
  data() {
    return {
      showDeleteDialog: false,
      loading: false,
      commitIdConfirmation: '',
      commit: this.stream.commit,
      nameRules: [
        (v) => !!v || 'Please write a commit message',
        (v) => (v && v.length >= 3) || 'Message must be at least 3 characters',
        (v) => (v && v.length <= 255) || 'Message must be less than 255 characters'
      ],
      valid: true
    }
  },
  mounted() {
    console.log(this.stream)
  },
  methods: {
    async editCommit() {
      this.$matomo && this.$matomo.trackPageView('commit/update')
      this.$mixpanel.track('Commit Action', { type: 'action', name: 'update' })
      this.loading = true
      try {
        await this.$apollo.mutate({
          mutation: gql`
            mutation commitUpdate($myCommit: CommitUpdateInput!) {
              commitUpdate(commit: $myCommit)
            }
          `,
          variables: {
            myCommit: { streamId: this.stream.id, id: this.commit.id, message: this.commit.message }
          }
        })
      } catch (err) {
        // TODO: show toast with error
      }
      this.loading = false
      this.$emit('close')
    },
    async deleteCommit() {
      this.$matomo && this.$matomo.trackPageView('commit/delete')
      this.$mixpanel.track('Commit Action', { type: 'action', name: 'delete' })
      let commitBranch = this.stream.commit.branchName
      try {
        await this.$apollo.mutate({
          mutation: gql`
            mutation commitUpdate($myCommit: CommitDeleteInput!) {
              commitDelete(commit: $myCommit)
            }
          `,
          variables: {
            myCommit: {
              streamId: this.stream.id,
              id: this.stream.commit.id
            }
          }
        })
      } catch (err) {
        // TODO: show toast with error
      }
      this.$router.push(`/streams/` + this.$route.params.streamId + `/branches/` + commitBranch)
      this.loading = false
      this.showDeleteDialog = false
    }
  }
}
</script>
