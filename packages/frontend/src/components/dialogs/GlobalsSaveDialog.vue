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
import gql from 'graphql-tag'

export default {
  props: {
    streamId: {
      type: String,
      default: null
    },
    commitObj: {
      type: Object,
      default: null
    },
    branchName: {
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
      let res = await this.$apollo.mutate({
        mutation: gql`
          mutation ObjectCreate($params: ObjectCreateInput!) {
            objectCreate(objectInput: $params)
          }
        `,
        variables: {
          params: {
            streamId: this.streamId,
            objects: [this.commitObj]
          }
        }
      })

      await this.$apollo.mutate({
        mutation: gql`
          mutation CommitCreate($commit: CommitCreateInput!) {
            commitCreate(commit: $commit)
          }
        `,
        variables: {
          commit: {
            streamId: this.streamId,
            branchName: this.branchName,
            objectId: res.data.objectCreate[0],
            message: this.message,
            sourceApplication: 'web'
          }
        }
      })
      this.loading = false
      this.$emit('close')
    }
  }
}
</script>
