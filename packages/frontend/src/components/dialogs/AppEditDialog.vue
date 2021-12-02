<template>
  <v-card class="pa-4" >
    <v-card-title>Edit App</v-card-title>
    <v-form v-show="!appUpdateResult" ref="form" v-model="valid" @submit.prevent="editApp">
      
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
        ></v-text-field>
        <v-textarea
          v-model="description"
          label="Description"
          persistent-hint
          hint="A short description of your application."
        ></v-textarea>
        <v-alert type="info" class="mt-5 ">
          <b>Note:</b> After editing an app, all users will need to authorise it again 
          (existing tokens will be invalidated).
        </v-alert>
        <v-card-actions>
          
          <v-spacer></v-spacer>

          <v-btn text  @click="clearAndClose">Cancel</v-btn>
          <v-btn text color="primary" type="submit" :disabled="!valid">Save</v-btn>
        </v-card-actions>
      </v-card-text>
    </v-form>
    <v-card-text v-show="appUpdateResult">
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
          <code style="word-break: break-all">{{ rootUrl }}/authn/verify/{appId}/{challenge}</code>
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
import gql from 'graphql-tag'

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
        (v) => (v && v.length >= 3) || 'Name must be at least 3 characters',
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
            // eslint-disable-next-line no-unused-vars
            let x = new URL(v)
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
  watch:{
    appDialog(val){
      if(val==0) this.clearAndClose() //if dialog was closed, on opening always show the initial editing form
    },
    // after any change, check if inputs are the same as already saved
    valid(){
      if (this.appName===this.name && this.appScopes===this.selectedScopes && this.appUrl===this.redirectUrl && this.appDescription===this.description) { 
        this.valid = false 
      } else this.valid = true
    },
    name(val){
      if (this.appName===val && this.appScopes===this.selectedScopes && this.appUrl===this.redirectUrl && this.appDescription===this.description) { 
        this.valid = false 
      } else this.valid = true
    },
    selectedScopes(val){
      if (this.appName===this.name && this.appScopes===val && this.appUrl===this.redirectUrl && this.appDescription===this.description) { 
        this.valid = false 
      } else this.valid = true
    },
    redirectUrl(val){
      if (this.appName===this.name && this.appScopes===this.selectedScopes && this.appUrl===val && this.appDescription===this.description) { 
        this.valid = false
      } else this.valid = true
    },
    description(val){
      if (this.appName===this.name && this.appScopes===this.selectedScopes && this.appUrl===this.redirectUrl && this.appDescription===val) { 
        this.valid = false
      } else this.valid = true
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
    },
    similarity(){
      if (this.appName===this.name && this.appScopes===this.selectedScopes && this.appUrl===this.redirectUrl && this.appDescription===this.description) this.valid = false
    }
  },
  methods: {
    clearAndClose() {
      this.appUpdateResult = null
      //this.name = null
      //this.selectedScopes = []
      this.$emit('close')
    },
    async editApp() {
      if (!this.$refs.form.validate()) return

      this.$matomo && this.$matomo.trackPageView('user/app/update') 
      try {
        
        let res = await this.$apollo.mutate({
          mutation: gql`
            mutation($app: AppUpdateInput!) {
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
        //this.name = null
        //this.selectedScopes = []
        this.$emit('app-edited')

      } catch (e) {
        // TODO: how do we catch and display errors?
        console.log(e)
      }
    }
  }
}
</script>
