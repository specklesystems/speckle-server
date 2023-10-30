<template>
  <v-card>
    <v-toolbar color="primary" dark flat>
      <v-app-bar-nav-icon style="pointer-events: none">
        <v-icon>mdi-source-branch</v-icon>
      </v-app-bar-nav-icon>
      <v-toolbar-title>New Branch</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon @click="$emit('close')"><v-icon>mdi-close</v-icon></v-btn>
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
          Tip: you can create nested branches by using "/" as a separator in their
          names. E.g., "mep/stage-1" or "arch/sketch-design".
        </p>
        <v-textarea v-model="description" rows="2" label="Description"></v-textarea>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" text :disabled="!valid" type="submit">Save</v-btn>
      </v-card-actions>
    </v-form>
  </v-card>
</template>
<script>
import { gql } from '@apollo/client/core'
import { formatBranchNameForURL } from '@/main/lib/stream/helpers/branches'

export default {
  data() {
    return {
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
          !(v.startsWith('#') || v.startsWith('/') || v.indexOf('//') !== -1) ||
          'Branch names cannot start with "#" or "/", or have multiple slashes next to each other (e.g., "//").',
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
    async submit() {
      if (!this.$refs.form.validate()) return

      this.loading = true
      this.$mixpanel.track('Branch Action', { type: 'action', name: 'create' })
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
        this.$emit('refetch-branches')
        this.$emit('close')

        try {
          await this.$router.push(
            `/streams/${this.$route.params.streamId}/branches/${formatBranchNameForURL(
              this.name.toLowerCase()
            )}`
          )
        } catch (routerErr) {
          if (routerErr?.name === 'NavigationDuplicated') {
            // Just created a new branch, while we're on its 404 page
            // Kind of an edge case, so as reloading the page is easier, i'll just do that instead of messing
            // with the Apollo cache
            location.reload()
          } else {
            throw routerErr
          }
        }
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
