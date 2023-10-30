<template>
  <v-card :loading="isLoading">
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
                v-model="message"
                label="Message"
                :rules="nameRules"
                required
                autofocus
              ></v-text-field>
              <p>Move this commit to a different branch:</p>
              <v-select
                v-model="newBranch"
                filled
                rounded
                dense
                hide-details
                :items="branchNames"
                prepend-icon="mdi-source-branch"
                class="pb-5"
              />
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
      <v-card class="pa-0" :loading="isLoading">
        <template slot="progress">
          <v-progress-linear indeterminate></v-progress-linear>
        </template>
        <v-toolbar color="error" dark flat>
          <v-app-bar-nav-icon style="pointer-events: none">
            <v-icon>mdi-pencil</v-icon>
          </v-app-bar-nav-icon>
          <v-toolbar-title>Delete Commit</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon @click="showDeleteDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar>
        <v-card-text class="mt-4">
          You cannot undo this action. This will permanently delete this commit. To
          confirm, type in its its id (
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
import { gql } from '@apollo/client/core'
import { useRoute } from '@/main/lib/core/composables/router'
import { useAllStreamBranches } from '@/main/lib/stream/composables/branches'
import { computed } from 'vue'
import { formatBranchNameForURL } from '@/main/lib/stream/helpers/branches'

export default {
  props: {
    stream: {
      type: Object,
      default: () => null
    }
  },
  setup() {
    const route = useRoute()
    const streamId = computed(() => route.params.streamId)
    const { localBranches, branchesLoading } = useAllStreamBranches(streamId)
    return {
      localBranches,
      branchesLoading,
      formatBranchNameForURL
    }
  },
  data() {
    return {
      showDeleteDialog: false,
      newBranch: this.stream.commit.branchName,
      message: this.stream.commit.message,
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
  computed: {
    branchNames() {
      return this.localBranches.map((b) => b.name)
    },
    isLoading() {
      return this.loading || this.branchesLoading
    }
  },
  methods: {
    async editCommit() {
      this.$mixpanel.track('Commit Action', { type: 'action', name: 'update' })
      this.loading = true
      const myCommit = {
        streamId: this.stream.id,
        id: this.commit.id
      }

      let messageChanged = false
      let branchChanged = false

      if (this.commit.message !== this.message) {
        messageChanged = true
        myCommit.message = this.message
      }

      if (this.commit.branchName !== this.newBranch) {
        branchChanged = true
        myCommit.newBranchName = this.newBranch
      }

      if (messageChanged || branchChanged)
        try {
          await this.$apollo.mutate({
            mutation: gql`
              mutation commitUpdate($myCommit: CommitUpdateInput!) {
                commitUpdate(commit: $myCommit)
              }
            `,
            variables: { myCommit }
          })
        } catch (err) {
          this.$eventHub.$emit('notification', {
            text: err.message
          })
        }
      this.loading = false
      this.commit.message = this.message
      this.commit.branchName = this.newBranch
      if (branchChanged) {
        this.$eventHub.$emit('notification', {
          text: `Commit moved to branch ${this.newBranch}.`,
          action: {
            name: 'View Branch',
            to: `/streams/${
              this.$route.params.streamId
            }/branches/${formatBranchNameForURL(this.newBranch)}`
          }
        })
      }
      this.$emit('close')
    },
    async deleteCommit() {
      this.$mixpanel.track('Commit Action', { type: 'action', name: 'delete' })
      const commitBranch = this.stream.commit.branchName
      try {
        await this.$apollo.mutate({
          mutation: gql`
            mutation commitDelete($myCommit: CommitDeleteInput!) {
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
        this.$eventHub.$emit('notification', {
          text: err.message
        })
      }
      this.$router.push(
        `/streams/` +
          this.$route.params.streamId +
          `/branches/` +
          formatBranchNameForURL(commitBranch)
      )
      this.loading = false
      this.showDeleteDialog = false
    }
  }
}
</script>
