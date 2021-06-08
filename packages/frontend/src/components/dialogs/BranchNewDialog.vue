<template>
  <v-dialog v-model="show" width="500" @keydown.esc="cancel">
    <v-card :loading="loading">
      <template slot="progress">
        <v-progress-linear indeterminate></v-progress-linear>
      </template>
      <v-card-title>New Branch</v-card-title>
      <v-form ref="form" v-model="valid" lazy-validation @submit.prevent="agree">
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
          <v-spacer></v-spacer>
          <v-btn color="primary" text :disabled="!valid" type="submit">Save</v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>
<script>
import gql from 'graphql-tag'

export default {
  data() {
    return {
      dialog: false,
      streamId: null,
      branchNames: [],
      valid: false,
      loading: false,
      name: null,
      nameRules: [
        (v) => !!v || 'Branches need a name too!',
        (v) =>
          (v && !v.startsWith('globals')) ||
          'Globals is a reserved branch name. Please choose a different name.',
        (v) =>
          (v && this.branchNames.findIndex((e) => e === v) === -1) ||
          'A branch with this name already exists',
        (v) => (v && v.length <= 100) || 'Name must be less than 100 characters',
        (v) => (v && v.length >= 3) || 'Name must be at least 3 characters'
      ],
      description: null,
      isEdit: false,
      pendingDelete: false
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
    open(streamId, branchNames) {
      this.dialog = true
      if (this.$refs.form) this.$refs.form.resetValidation()

      this.branchNames = branchNames
      this.streamId = streamId

      return new Promise((resolve, reject) => {
        this.resolve = resolve
        this.reject = reject
      })
    },
    async agree() {
      if (!this.$refs.form.validate()) return

      this.loading = true
      this.$matomo && this.$matomo.trackPageView('branch/create')
      await this.$apollo.mutate({
        mutation: gql`
          mutation branchCreate($params: BranchCreateInput!) {
            branchCreate(branch: $params)
          }
        `,
        variables: {
          params: {
            streamId: this.streamId,
            name: this.name,
            description: this.description
          }
        }
      })
      this.loading = false

      this.resolve({
        result: true,
        name: this.name
      })
      this.dialog = false
    }
  },
  cancel() {
    this.resolve({
      result: false
    })
    this.dialog = false
  }
}
</script>
