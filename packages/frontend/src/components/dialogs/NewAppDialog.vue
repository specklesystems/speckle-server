<template>
  <v-card class="pa-4" color="background2">
    <v-card-title>
      Create a New App
      <v-spacer></v-spacer>
      <v-btn text color="error" icon @click="clearAndClose">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-card-title>
    <v-card-text>
      <v-form v-show="!appCreateResult">
        <h3 class="mt-3">App Name</h3>
        <v-text-field
          v-model="name"
          label="App Name"
          :rules="nameRules"
          required
          autofocus
        ></v-text-field>
        <br />
        <h3 class="mt-3">App Scopes</h3>
        <p>It's good practice to limit the scopes to the absolute minimum.</p>
        <v-select
          v-model="selectedScopes"
          label="Scopes"
          multiple
          required
          :items="parsedScopes"
          chips
          :menu-props="{ maxWidth: 420 }"
        ></v-select>
        <br />
        <h3 class="mt-3">Redirect URL</h3>
        <p>
          After authentication, the users will be redirected (together with an access token) to this
          url.
        </p>
        <v-text-field
          v-model="redirectUrl"
          label="App redirect url"
          :rules="redirectUrlRules"
          required
        ></v-text-field>
        <br />
        <h3 class="mt-3">App Description</h3>
        <v-textarea
          v-model="description"
          label="A short description of your applicaiton."
        ></v-textarea>
        <v-btn @click="createApp">Save</v-btn>
        <v-btn text color="error" @click="clearAndClose">Cancel</v-btn>
      </v-form>
      <div v-show="appCreateResult">
        <div v-if="app" class="text-center my-5">
          <h2 class="mb-5 font-weight-normal">Your new app's details:</h2>
          App Id:
          <code class="subtitle-1 pa-3 my-4">{{ app.id }}</code>
          <v-divider class="mt-5 pt-5" />
          App Secret:
          <code class="subtitle-1 pa-3 my-4">{{ app.secret }}</code>
        </div>
        <v-alert type="info">
          <p>
            <b>Note:</b>
            To authenticate users inside your app, direct them to
            <code style="word-break: break-all">
              {{ rootUrl }}/authn/verify/{appId}/{challenge}
            </code>
            , where
            <code>challenge</code>
            is an OAuth2 plain code challenge.
          </p>
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
      prefetch: true,
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
    },
    app: {
      query: gql`
        query($id: String!) {
          app(id: $id) {
            id
            name
            secret
          }
        }
      `,
      variables() {
        return { id: this.appCreateResult }
      },
      skip() {
        return !this.appCreateResult
      }
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
      redirectUrl: null,
      redirectUrlRules: [
        (v) => !!v || 'Redirect url is required',
        (v) => {
          try {
            var x = new URL(v)
            return true
          } catch {
            return 'url must be valid'
          }
        }
      ],
      logo: null,
      description: null,
      appCreateResult: null
    }
  },
  computed: {
    rootUrl() {
      return window.location.origin
    },
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
      this.appCreateResult = null
      this.name = null
      this.selectedScopes = []
      this.$emit('close')
    },
    async createApp() {
      this.$matomo && this.$matomo.trackPageView('user/app/create')
      try {
        let res = await this.$apollo.mutate({
          mutation: gql`
            mutation($app: AppCreateInput!) {
              appCreate(app: $app)
            }
          `,
          variables: {
            app: {
              name: this.name,
              scopes: this.selectedScopes,
              redirectUrl: this.redirectUrl,
              description: this.description
            }
          }
        })
        this.appCreateResult = res.data.appCreate
        this.name = null
        this.selectedScopes = []
        this.$emit('app-added')
      } catch (e) {
        // TODO: how do we catch and display errors?
        console.log(e)
      }
    }
  }
}
</script>
