<template>
  <v-card v-if="editableBranch && editableBranch.name !== 'main'" :loading="loading">
    <v-toolbar color="primary" dark flat>
      <v-app-bar-nav-icon style="pointer-events: none">
        <v-icon>mdi-pencil</v-icon>
      </v-app-bar-nav-icon>
      <v-toolbar-title>Edit Branch</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon @click="$emit('close')"><v-icon>mdi-close</v-icon></v-btn>
    </v-toolbar>
    <v-alert v-show="error" dismissible type="error">
      {{ error }}
    </v-alert>
    <v-form ref="form" v-model="valid" lazy-validation @submit.prevent="updateBranch">
      <v-card-text>
        <v-text-field
          v-model="editableBranch.name"
          label="Name"
          :rules="nameRules"
          required
        ></v-text-field>
        <p class="caption">
          Tip: you can create nested branches by using "/" as a separator in their
          names. E.g., "mep/stage-1" or "arch/sketch-design".
        </p>
        <v-textarea
          v-model="editableBranch.description"
          rows="2"
          label="Description"
        ></v-textarea>
      </v-card-text>
    </v-form>
    <v-card-actions>
      <v-btn text color="error" @click="showDeleteDialog = true">
        <v-icon small>mdi-delete</v-icon>
        <span class="ml-2">Delete</span>
      </v-btn>
      <v-spacer></v-spacer>
      <v-btn text @click="$emit('close')">Cancel</v-btn>
      <v-btn color="primary" :disabled="!valid" @click="updateBranch()">Save</v-btn>
    </v-card-actions>
    <v-dialog v-model="showDeleteDialog" max-width="500">
      <v-card>
        <v-toolbar color="error" dark flat>
          <v-app-bar-nav-icon style="pointer-events: none">
            <v-icon>mdi-pencil</v-icon>
          </v-app-bar-nav-icon>
          <v-toolbar-title>Delete Branch</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon @click="showDeleteDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar>
        <v-card-text class="mt-4">
          You cannot undo this action. The branch
          <code>{{ initialBranch.name }}</code>
          will be permanently deleted. To confirm, type its name below:
          <v-text-field
            v-model="branchNameConfirmation"
            label="Confirm branch name"
            required
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="showDeleteDialog = false">Cancel</v-btn>
          <v-btn
            color="error"
            text
            :disabled="branchNameConfirmation !== initialBranch.name"
            @click="deleteBranch()"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
  <v-card v-else>
    <v-card-text>You cannot edit the main branch.</v-card-text>
  </v-card>
</template>
<script>
import { gql } from '@apollo/client/core'
import isNull from 'lodash/isNull'
import isUndefined from 'lodash/isUndefined'
import clone from 'lodash/clone'
import { StreamEvents } from '@/main/lib/core/helpers/eventHubHelper'
import { formatBranchNameForURL } from '@/main/lib/stream/helpers/branches'
import {
  convertThrowIntoFetchResult,
  getFirstErrorMessage
} from '@/main/lib/common/apollo/helpers/apolloOperationHelper'
export default {
  props: {
    stream: {
      type: Object,
      default: () => null
    }
  },
  setup() {
    return { formatBranchNameForURL }
  },
  data() {
    return {
      dialog: false,
      // Cloning to prevent mutation of this.stream.branch
      editableBranch: clone(this.stream.branch),
      initialBranch: clone(this.stream.branch),
      branchNameConfirmation: null,
      valid: true,
      loading: false,
      showDeleteDialog: false,
      nameRules: [
        (v) => !!v || 'Name is required.',
        (v) =>
          !(
            v.startsWith('#') ||
            v.endsWith('#') ||
            v.startsWith('/') ||
            v.endsWith('/')
          ) || 'Branch names cannot start or end with "#" or "/"',
        (v) =>
          (v && this.allBranchNames.findIndex((e) => e === v) === -1) ||
          'A branch with this name already exists',
        (v) => (v && v.length <= 100) || 'Name must be less than 100 characters',
        (v) => (v && v.length >= 3) || 'Name must be at least 3 characters'
      ],
      isEdit: false,
      pendingDelete: false,
      allBranchNames: [],
      error: null
    }
  },
  apollo: {
    allBranchNames: {
      query: gql`
        query branchNames($id: String!) {
          stream(id: $id) {
            id
            branches {
              items {
                id
                name
              }
            }
          }
        }
      `,
      variables() {
        return {
          id: this.$route.params.streamId
        }
      },
      update(data) {
        return data.stream.branches.items
          .filter((b) => b.name !== this.stream.branch.name)
          .map((b) => b.name)
      },
      skip() {
        return isNull(this.initialBranch) || isUndefined(this.initialBranch)
      }
    }
  },
  methods: {
    async deleteBranch() {
      this.loading = true
      this.error = null
      this.$mixpanel.track('Branch Action', { type: 'action', name: 'delete' })

      const streamId = this.$route.params.streamId
      const branchId = this.initialBranch.id

      try {
        const res = await this.$apollo.mutate({
          mutation: gql`
            mutation branchDelete($params: BranchDeleteInput!) {
              branchDelete(branch: $params)
            }
          `,
          variables: {
            params: {
              streamId,
              id: branchId
            }
          }
        })
        if (!res.data.branchDelete) throw new Error('Something went wrong!')
      } catch (err) {
        this.$eventHub.$emit('notification', { text: err.message })
        return
      }

      this.loading = false
      this.showDelete = false
      this.showDeleteDialog = false
      this.editableBranch = null
      this.$eventHub.$emit('notification', { text: 'Branch deleted' })
      this.$router.push(`/streams/` + this.$route.params.streamId)
      this.$emit('close')
      this.$eventHub.$emit(StreamEvents.RefetchBranches)
    },
    async updateBranch() {
      if (!this.$refs.form.validate()) return

      if (this.allBranchNames.indexOf(this.editableBranch.name) !== -1) {
        this.$eventHub.$emit('notification', {
          text: 'Branch already exists. Please choose a different name.'
        })
        return
      }

      this.loading = true
      this.$mixpanel.track('Branch Action', { type: 'action', name: 'update' })

      const branchId = this.editableBranch.id
      const newName = this.editableBranch.name
      const newDescription = this.editableBranch.description

      const res = await this.$apollo
        .mutate({
          mutation: gql`
            mutation branchUpdate($params: BranchUpdateInput!) {
              branchUpdate(branch: $params)
            }
          `,
          variables: {
            params: {
              streamId: this.$route.params.streamId,
              id: branchId,
              name: newName,
              description: newDescription
            }
          }
        })
        .catch(convertThrowIntoFetchResult)

      const success = !!res.data?.branchUpdate
      const error = getFirstErrorMessage(res.errors)

      this.loading = false

      if (success) {
        this.$eventHub.$emit(StreamEvents.RefetchBranches)
        this.$eventHub.$emit('notification', {
          text: 'Branch updated',
          action: {
            name: 'View',
            to:
              `/streams/` +
              this.$route.params.streamId +
              `/branches/` +
              this.formatBranchNameForURL(this.editableBranch.name)
          }
        })
        this.$router.push(
          `/streams/` +
            this.$route.params.streamId +
            `/branches/` +
            this.formatBranchNameForURL(this.editableBranch.name)
        )
        this.$emit('close')
      } else {
        this.$eventHub.$emit('notification', { text: error })
      }
    }
  }
}
</script>
