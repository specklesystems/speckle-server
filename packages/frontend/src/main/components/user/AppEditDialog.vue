<template>
  <v-card>
    <v-card-title class="primary white--text">Edit App</v-card-title>
    <v-form
      v-show="!appUpdateResult"
      ref="form"
      v-model="valid"
      @submit.prevent="editApp"
    >
      <v-card-text>
        <v-text-field
          v-model="name"
          label="App Name"
          persistent-hint
          hint="The name of your app"
          :rules="nameRules"
          validate-on-blur
          required
          autofocus
          @input="checkValidity()"
          @focus="checkValidity()"
        ></v-text-field>
        <v-select
          v-model="selectedScopes"
          persistent-hint
          hint="It's good practice to limit the scopes to the absolute minimum."
          label="Scopes"
          multiple
          required
          validate-on-blur
          :rules="selectedScopesRules"
          :items="parsedScopes"
          chips
          :menu-props="{ maxWidth: 420 }"
          @input="checkValidity()"
          @focus="checkValidity()"
        ></v-select>
        <v-text-field
          v-model="redirectUrl"
          persistent-hint
          validate-on-blur
          hint="
            After authentication, the users will be redirected (together with an access token) to this url.
          "
          label="Redirect url"
          :rules="redirectUrlRules"
          required
          @input="checkValidity()"
          @focus="checkValidity()"
        ></v-text-field>
        <v-textarea
          v-model="description"
          label="Description"
          persistent-hint
          hint="A short description of your application."
          @input="checkValidity()"
          @focus="checkValidity()"
        ></v-textarea>
        <v-alert type="info" class="mt-5">
          <b>Note:</b>
          After editing an app, all users will need to authorise it again (existing
          tokens will be invalidated).
        </v-alert>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="clearAndClose">Cancel</v-btn>
          <v-btn text color="primary" type="submit" :disabled="!valid">Save</v-btn>
        </v-card-actions>
      </v-card-text>
    </v-form>
    <v-card-text v-show="appUpdateResult">
      <p>App updated!</p>
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
    },
    appId: {
      type: String,
      default: null
    },
    appName: {
      type: String,
      default: null
    },
    appSecret: {
      type: String,
      default: null
    },
    appUrl: {
      type: String,
      default: null
    },
    appDescription: {
      type: String,
      default: null
    },
    appScopes: {
      type: Array,
      default: null
    },
    appDialog: {
      type: Boolean,
      default: false
    }
  },
  apollo: {
    scopes: {
      prefetch: true,
      query: fullServerInfoQuery,
      update: (data) => data.serverInfo.scopes
    },
    app: {
      query: gql`
        query ($id: String!) {
          app(id: $id) {
            id
            name
            secret
          }
        }
      `,
      variables() {
        return { id: this.appId }
      },
      skip() {
        return !this.appId
      }
    }
  },
  data() {
    return {
      valid: false,
      name: this.appName,
      nameRules: [
        (v) => !!v || 'Name is required',
        (v) => (v && v.length <= 60) || 'Name must be less than 60 characters',
        (v) => (v && v.length >= 3) || 'Name must be at least 3 characters'
      ],
      selectedScopes: this.appScopes,
      selectedScopesRules: [
        (v) => !!v || 'Scopes are required',
        (v) => (v && v.length >= 1) || 'Scopes are required'
      ],
      redirectUrl: this.appUrl,
      redirectUrlRules: [
        (v) => !!v || 'Redirect url is required',
        (v) => {
          try {
            new URL(v)
            return true
          } catch {
            return 'Url must be valid'
          }
        }
      ],
      logo: null,
      description: this.appDescription,
      appUpdateResult: null
    }
  },
  computed: {
    rootUrl() {
      return window.location.origin
    },
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
  watch: {
    appDialog(val) {
      if (val === 0) this.clearAndClose() //if dialog was closed, on opening always show the initial editing form
    }
  },
  methods: {
    clearAndClose() {
      this.appUpdateResult = null
      this.$emit('close')
    },
    checkValidity() {
      if (
        this.appName === this.name &&
        this.appScopes === this.selectedScopes &&
        this.appUrl === this.redirectUrl &&
        this.appDescription === this.description
      ) {
        this.valid = false
      } else {
        this.valid = true
      }
    },
    async editApp() {
      if (!this.$refs.form.validate()) return
      this.$mixpanel.track('App Action', { type: 'action', name: 'update' })
      try {
        const res = await this.$apollo.mutate({
          mutation: gql`
            mutation ($app: AppUpdateInput!) {
              appUpdate(app: $app)
            }
          `,
          variables: {
            app: {
              id: this.appId,
              name: this.name,
              scopes: this.selectedScopes,
              redirectUrl: this.redirectUrl,
              description: this.description
            }
          }
        })

        this.appUpdateResult = res.data.appUpdate
        this.$emit('app-edited')
      } catch (e) {
        this.$eventHub.$emit('notification', {
          text: e.message
        })
      }
    }
  }
}
</script>
