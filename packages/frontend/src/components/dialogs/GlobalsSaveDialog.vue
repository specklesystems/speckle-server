<template>
  <v-card :loading="loading">
    <template slot="progress">
      <v-progress-linear indeterminate></v-progress-linear>
    </template>
    <v-card-title>Save Globals</v-card-title>
    <v-form ref="form" v-model="valid" lazy-validation @submit.prevent="saveGlobals">
      <v-card-text>
        <v-text-field
          v-model="message"
          label="Message"
          :rules="nameRules"
          validate-on-blur
          required
          autofocus
        ></v-text-field>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" text :disabled="!valid" type="submit">Save</v-btn>
      </v-card-actions>
    </v-form>
  </v-card>
</template>
<script>
export default {
  props: {
    streamId: {
      type: String,
      default: null
    }
  },
  data() {
    return {
      valid: false,
      loading: false,
      name: null,
      nameRules: [(v) => (v && v.length >= 3) || 'Message must be at least 3 characters'],
      message: null
    }
  },
  computed: {},
  methods: {
    async saveGlobals() {
      if (!this.$refs.form.validate()) return

      this.loading = true
      this.$matomo && this.$matomo.trackPageView('globals/save')
      // await this.$apollo.mutate({
      //   mutation: gql`
      //     mutation branchCreate($params: BranchCreateInput!) {
      //       branchCreate(branch: $params)
      //     }
      //   `,
      //   variables: {
      //     params: {
      //       streamId: this.streamId,
      //       name: this.name,
      //       description: this.description
      //     }
      //   }
      // })
      this.loading = false
      this.$emit('close')
    }
  }
}
</script>
