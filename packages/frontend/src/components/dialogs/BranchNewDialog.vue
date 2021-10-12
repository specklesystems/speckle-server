<template>
  <v-dialog v-model="showDialog" max-width="400" :fullscreen="$vuetify.breakpoint.xsOnly">
    <v-card>
      <v-toolbar color="primary" dark flat>
        <v-app-bar-nav-icon style="pointer-events: none">
          <v-icon>mdi-source-branch</v-icon>
        </v-app-bar-nav-icon>
        <v-toolbar-title>New Branch</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon @click="showDialog = false"><v-icon>mdi-close</v-icon></v-btn>
      </v-toolbar>
      <v-alert v-model="showError" dismissible type="error">
        {{ error }}
      </v-alert>
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
          <p class="caption">
            Tip: you can create nested branches by using "/" as a separator in their names. E.g.,
            "mep/stage-1" or "arch/sketch-design".
          </p>
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
      showError: false,
      error: null,
      streamId: null,
      reservedBranchNames: ['main', 'globals'],
      valid: false,
      loading: false,
      name: '',
      nameRules: [
        (v) => !!v || 'Branches need a name too!',
        (v) =>
          !(v.startsWith('#') || v.startsWith('/')) || 'Branch names cannot start with "#" or "/"',
        (v) =>
          (v && this.reservedBranchNames.findIndex((e) => e === v) === -1) ||
          'This is a reserved branch name',
        (v) => (v && v.length <= 100) || 'Name must be less than 100 characters',
        (v) => (v && v.length >= 3) || 'Name must be at least 3 characters'
      ],
      description: null
    }
  },
  computed: {},
  watch: {
    name(val) {
      this.name = val.toLowerCase()
    }
  },
  methods: {
    show() {
      this.showDialog = true
    },
    async submit() {
      if (!this.$refs.form.validate()) return

      this.loading = true
      this.$matomo && this.$matomo.trackPageView('branch/create')
      try {
        await this.$apollo.mutate({
          mutation: gql`
            mutation branchCreate($params: BranchCreateInput!) {
              branchCreate(branch: $params)
            }
          `,
          variables: {
            params: {
              streamId: this.$route.params.streamId,
              name: this.name.toLowerCase(),
              description: this.description
            }
          }
        })
        this.showError = false
        this.error = null
        this.loading = false
        this.showDialog = false
        this.$emit('refetch-branches')
        this.$router.push(
          `/streams/${this.$route.params.streamId}/branches/${this.name.toLowerCase()}`
        )
      } catch (err) {
        this.showError = true
        if (err.message.includes('branches_streamid_name_unique'))
          this.error = 'A branch with that name already exists.'
        else this.error = err.message
      }
    }
  }
}
</script>
