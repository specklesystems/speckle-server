<template>
  <v-card :loading="loading">
    <template slot="progress">
      <v-progress-linear indeterminate></v-progress-linear>
    </template>
    <v-card-title>New Branch</v-card-title>
    <v-card-text>
      <v-form ref="form" v-model="valid" lazy-validation>
        <v-text-field
          v-model="name"
          label="Name"
          :rules="nameRules"
          required
          autofocus
        ></v-text-field>
        <v-textarea v-model="description" rows="2" label="Description"></v-textarea>
      </v-form>
    </v-card-text>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn color="primary" text :disabled="!valid" @click="createBranch">Save</v-btn>
    </v-card-actions>
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
    branchNames: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      valid: true,
      loading: false,
      name: null,
      nameRules: [
        (v) => !!v || 'Branches need a name too!',
        (v) =>
          (v && this.branchNames.findIndex((e) => e === v) === -1) ||
          'A branch with this name already exists',
        (v) => (v && v.length <= 25) || 'Name must be less than 25 characters',
        (v) => (v && v.length >= 3) || 'Name must be at least 3 characters'
      ],
      description: null,
      isEdit: false,
      pendingDelete: false
    }
  },
  computed: {},
  methods: {
    async createBranch() {
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
      this.$emit('close')
    }
  }
}
</script>
