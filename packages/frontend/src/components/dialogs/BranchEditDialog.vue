<template>
  <v-card :loading="loading">
    <template slot="progress">
      <v-progress-linear indeterminate></v-progress-linear>
    </template>
    <div v-if="branch.name !== 'main'">
      <v-card-title>Edit Branch</v-card-title>
      <v-form ref="form" v-model="valid" lazy-validation @submit.prevent="updateBranch">
        <v-card-text>
          <v-text-field
            v-model="name"
            label="Name"
            :rules="nameRules"
            validate-on-blur
            required
            autofocus
          ></v-text-field>
          <v-textarea v-model="description" rows="2" label="Description"></v-textarea>
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" block :disabled="!valid" type="submit">Save</v-btn>
        </v-card-actions>
      </v-form>
      <v-card-actions class="error--text body-2 pa-2">
        <v-btn block x-small text color="error" @click="showDelete = true">Delete Branch</v-btn>
        <v-dialog v-model="showDelete" max-width="500">
          <v-card>
            <v-card-title>Are you sure?</v-card-title>
            <v-card-text>
              You cannot undo this action. The branch
              <b>{{ name }}</b>
              will be permanently deleted.
            </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn @click="showDelete = false">Cancel</v-btn>
              <v-btn color="error" text @click="deleteBranch">Delete</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-card-actions>
    </div>
    <div v-else>
      <v-card-text>You cannot edit the main branch.</v-card-text>
    </div>
  </v-card>
</template>
<script>
import gql from 'graphql-tag'

export default {
  props: {
    streamId: {
      type: String,
      default: null
    },
    branch: {
      type: Object,
      default() {
        return {
          name: null,
          description: null
        }
      }
    }
  },
  data() {
    return {
      valid: true,
      loading: false,
      name: this.branch.name,
      showDelete: false,
      nameRules: [
        (v) => !!v || 'Branches need a name too!',
        (v) =>
          (v && this.allBranchNames.findIndex((e) => e === v) === -1) ||
          'A branch with this name already exists',
        (v) => (v && v.length <= 100) || 'Name must be less than 100 characters',
        (v) => (v && v.length >= 3) || 'Name must be at least 3 characters'
      ],
      description: this.branch.description,
      isEdit: false,
      pendingDelete: false,
      allBranchNames: []
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
          .map((b) => b.name)
          .filter((name) => name !== this.branch.name)
      }
    }
  },
  computed: {},
  methods: {
    async deleteBranch() {
      this.loading = true
      this.$matomo && this.$matomo.trackPageView('branch/delete')
      try {
        await this.$apollo.mutate({
          mutation: gql`
            mutation branchDelete($params: BranchDeleteInput!) {
              branchDelete(branch: $params)
            }
          `,
          variables: {
            params: {
              streamId: this.$route.params.streamId,
              id: this.branch.id
            }
          }
        })
      } catch (e) {
        console.log(e)
      }
      this.$emit('close', { deleted: true })
      this.loading = false
    },
    async updateBranch() {
      if (!this.$refs.form.validate()) return

      this.loading = true
      this.$matomo && this.$matomo.trackPageView('branch/update')
      await this.$apollo.mutate({
        mutation: gql`
          mutation branchUpdate($params: BranchUpdateInput!) {
            branchUpdate(branch: $params)
          }
        `,
        variables: {
          params: {
            streamId: this.$route.params.streamId,
            id: this.branch.id,
            name: this.name,
            description: this.description
          }
        }
      })
      this.loading = false
      this.$emit('close', { name: this.name })
    }
  }
}
</script>
