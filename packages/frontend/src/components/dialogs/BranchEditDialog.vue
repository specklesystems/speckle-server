<template>
  <v-dialog v-model="show" width="500" @keydown.esc="cancel">
    <v-card :loading="loading" class="pa-4">
      <template slot="progress">
        <v-progress-linear indeterminate></v-progress-linear>
      </template>
      <div v-if="branch && branch.name !== 'main'">
        <v-card-title>Edit Branch</v-card-title>
        <v-form ref="form" v-model="valid" lazy-validation @submit.prevent="agree">
          <v-card-text>
            <v-text-field
              v-model="branch.name"
              label="Name"
              :rules="nameRules"
              validate-on-blur
              required
              autofocus
            ></v-text-field>
            <v-textarea v-model="branch.description" rows="2" label="Description"></v-textarea>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn text @click="cancel">Cancel</v-btn>
            <v-btn color="primary" text :disabled="!valid" type="submit">Save</v-btn>
          </v-card-actions>
        </v-form>
        <v-card-actions class="error--text body-2 pa-2">
          <v-btn block x-small text color="error" @click="showDelete = true">Delete Branch</v-btn>
          <v-dialog v-model="showDelete" max-width="500">
            <v-card>
              <v-card-title>Are you sure?</v-card-title>
              <v-card-text>
                You cannot undo this action. The branch
                <b>{{ branch.name }}</b>
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
  </v-dialog>
</template>
<script>
import gql from 'graphql-tag'

export default {
  data() {
    return {
      dialog: false,
      branch: null,
      valid: true,
      loading: false,
      showDelete: false,
      nameRules: [
        (v) => !!v || 'Branches need a name too!',
        (v) =>
          (v && this.allBranchNames.findIndex((e) => e === v) === -1) ||
          'A branch with this name already exists',
        (v) => (v && v.length <= 100) || 'Name must be less than 100 characters',
        (v) => (v && v.length >= 3) || 'Name must be at least 3 characters'
      ],
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
        return data.stream.branches.items.filter((b) => b.name !== this.branch.name)
      },
      skip() {
        return this.branch == null
      }
    }
  },
  computed: {
    show: {
      get() {
        return this.dialog
      },
      set(value) {
        this.dialog = value
        if (value === false) {
          this.cancel()
        }
      }
    }
  },
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

      this.loading = false

      this.resolve({
        result: true,
        deleted: true
      })
      this.dialog = false
    },
    open(branch) {
      this.dialog = true
      if (this.$refs.form) this.$refs.form.resetValidation()

      this.branch = { ...branch }

      return new Promise((resolve, reject) => {
        this.resolve = resolve
        this.reject = reject
      })
    },
    async agree() {
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
            name: this.branch.name,
            description: this.branch.description
          }
        }
      })

      this.loading = false

      this.resolve({
        result: true,
        name: this.branch.name
      })
      this.dialog = false
    },
    cancel() {
      this.resolve({
        result: false
      })
      this.dialog = false
    }
  }
}
</script>
