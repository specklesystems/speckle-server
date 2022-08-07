<template>
  <v-card class="pa-4">
    <v-card-title>Create a New Personal Access Token</v-card-title>
    <v-form
      v-show="!fullTokenResult"
      ref="form"
      v-model="valid"
      @submit.prevent="createToken"
    >
      <v-card-text>
        <v-text-field
          v-model="name"
          label="Token Name"
          :rules="nameRules"
          hint="A name to remember this token by. For example, the name of the script or application you're
          planning to use it in!"
          persistent-hint
          validate-on-blur
          required
          filled
          autofocus
        ></v-text-field>

        <v-select
          v-model="selectedScopes"
          label="Scopes"
          multiple
          hint="It's good practice to limit the scopes of your token to the absolute minimum. For example,
          if your application or script will only read and write streams, select just those scopes."
          persistent-hint
          validate-on-blur
          required
          :rules="selectedScopesRules"
          :items="parsedScopes"
          chips
          :menu-props="{ maxWidth: 420 }"
        ></v-select>
        <v-card-actions>
          <v-spacer />
          <v-btn text color="error" @click="clearAndClose">Cancel</v-btn>
          <v-btn type="submit">Save</v-btn>
        </v-card-actions>
      </v-card-text>
    </v-form>
    <v-card-text v-show="fullTokenResult">
      <div class="text-center my-5">
        <h2 class="mb-5 font-weight-normal">Your new token:</h2>
        <code class="subtitle-1 pa-3 my-4">{{ fullTokenResult }}</code>
      </div>
      <v-alert type="info">
        <b>Note:</b>
        This is the first and last time you will be able to see the full token. Please
        copy paste it somewhere safe now.
      </v-alert>
      <v-btn block color="primary" @click="clearAndClose">Close</v-btn>
    </v-card-text>
  </v-card>
</template>
<script>
import { gql } from '@apollo/client/core'
import { fullServerInfoQuery } from '@/graphql/server'

export default {
  props: {
    show: {
      type: Boolean,
      default: false
    }
  },
  apollo: {
    scopes: {
      query: fullServerInfoQuery,
      update: (data) => data.serverInfo.scopes
    }
  },
  data() {
    return {
      name: null,
      valid: false,
      nameRules: [
        (v) => !!v || 'Name is required',
        (v) => (v && v.length <= 60) || 'Name must be less than 60 characters'
      ],
      selectedScopes: [],
      selectedScopesRules: [
        (v) => !!v || 'Scopes are required',
        (v) => (v && v.length >= 1) || 'Scopes are required'
      ],
      fullTokenResult: null
    }
  },
  computed: {
    parsedScopes() {
      if (!this.scopes) return []
      const arr = []
      for (const s of this.scopes) {
        arr.push({ text: s.name, value: s.name })
        arr.push({ header: s.description })
        arr.push({ divider: true })
      }
      return arr
    }
  },
  methods: {
    clearAndClose() {
      this.fullTokenResult = null
      this.name = null
      this.selectedScopes = []
      this.$emit('close')
    },
    async createToken() {
      if (!this.$refs.form.validate()) return

      this.$mixpanel.track('Token Action', { type: 'action', name: 'create' })
      try {
        const res = await this.$apollo.mutate({
          mutation: gql`
            mutation ($token: ApiTokenCreateInput!) {
              apiTokenCreate(token: $token)
            }
          `,
          variables: {
            token: {
              name: this.name,
              scopes: this.selectedScopes
            }
          }
        })
        this.fullTokenResult = res.data.apiTokenCreate
        this.name = null
        this.selectedScopes = []
        this.$emit('token-added')
      } catch (e) {
        // TODO: how do we catch and display errors?
        console.log(e)
      }
    }
  }
}
</script>
