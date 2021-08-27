<template>
  <v-dialog v-model="showDialog" max-width="400" :fullscreen="$vuetify.breakpoint.xsOnly">
    <v-card>
      <v-toolbar color="primary" dark>
        <v-app-bar-nav-icon style="pointer-events: none">
          <v-icon>mdi-source-branch</v-icon>
        </v-app-bar-nav-icon>
        <v-toolbar-title>New Branch</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon @click="showDialog = false"><v-icon>mdi-close</v-icon></v-btn>
      </v-toolbar>
      <v-form ref="form" v-model="valid" lazy-validation @submit.prevent="submit">
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
      showDialog: false,
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
  },
  methods: {
    show() {
      this.showDialog = true
    },
    async submit() {
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
            streamId: this.$route.params.streamId,
            name: this.name,
            description: this.description
          }
        }
      })
      this.loading = false
      this.showDialog = false
      this.$emit('refetch-branches')
      this.$router.push(`/streams/${this.$route.params.streamId}/branches/${this.name}`)
    }
  }
}
</script>
