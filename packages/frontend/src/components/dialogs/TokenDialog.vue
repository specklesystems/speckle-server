<template>
  <v-card class="pa-4" color="background2">
    <v-card-title>
      Create a New Personal Access Token
      <v-spacer></v-spacer>
      <v-btn text color="error" icon @click="clearAndClose">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-card-title>
    <v-card-text>
      <v-form v-show="!fullTokenResult">
        <h3 class="mt-3">Token Scopes</h3>
        <p>
          It's good practice to limit the scopes of your token to the absolute minimum. For example,
          if your application or script will only read and write streams, select just those scopes.
        </p>
        <v-select
          v-model="selectedScopes"
          label="Scopes"
          multiple
          required
          :items="parsedScopes"
          chips
          :menu-props="{ maxWidth: 420 }"
        ></v-select>
        <p v-if="selectedScopes.length === 0" class="error--text">Please select some scopes.</p>
        <br />
        <h3 class="mt-3">Token Name</h3>
        <p>
          A name to remember this token by - can be the name of the script or application you're
          planning to use it in!
        </p>
        <v-text-field
          v-model="name"
          label="Token Name"
          :rules="nameRules"
          required
          filled
          autofocus
        ></v-text-field>
        <br />
        <v-btn @click="createToken">Save</v-btn>
        <v-btn text color="error" @click="clearAndClose">Cancel</v-btn>
      </v-form>
      <div v-show="fullTokenResult">
        <div class="text-center my-5">
          <h2 class="mb-5 font-weight-normal">Your new token:</h2>
          <code class="subtitle-1 pa-3 my-4">{{ fullTokenResult }}</code>
        </div>
        <v-alert type="info">
          <b>Note:</b>
          This is the first and last time you will be able to see the full token. Please copy paste
          it somewhere safe now.
        </v-alert>
        <v-btn block color="primary" @click="clearAndClose">Close</v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>
<script>
import gql from 'graphql-tag'

export default {
  props: {
    show: {
      type: Boolean,
      default: false
    }
  },
  apollo: {
    scopes: {
      query: gql`
        query {
          serverInfo {
            scopes {
              name
              description
            }
          }
        }
      `,
      update: (data) => data.serverInfo.scopes
    }
  },
  data() {
    return {
      name: null,
      nameRules: [
        (v) => !!v || 'Name is required',
        (v) => (v && v.length <= 60) || 'Name must be less than 60 characters'
      ],
      selectedScopes: [],
      fullTokenResult: null
    }
  },
  computed: {
    parsedScopes() {
      if (!this.scopes) return []
      let arr = []
      for (let s of this.scopes) {
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
      this.$matomo && this.$matomo.trackPageView('user/token/create')
      try {
        let res = await this.$apollo.mutate({
          mutation: gql`
            mutation($token: ApiTokenCreateInput!) {
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
