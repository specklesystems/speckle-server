<template>
  <v-container fluid>
    <v-row v-if="state === 0" style="margin-top: -10px" dense>
      <v-col cols="12">
        <div>
          <p class="title font-weight-light text-center">
            Authorize
            <span class="primary--text">
              <b>{{ app.name }}</b>
            </span>
            by
            <b>{{ app.author }}</b>
            ?
          </p>
          <p class="caption text-center">
            Clicking allow will redirect you to
            <i>{{ app.redirectUrl }}</i>
          </p>
        </div>
        <v-expansion-panels
          v-show="!app.firstparty"
          v-model="panel"
          multiple
          hover
          tile
          flat
          small
        >
          <v-expansion-panel>
            <v-expansion-panel-header class="elevation-0">
              <b>Requested permissions:</b>
              <template #actions>
                <v-icon color="primary">mdi-alert-circle</v-icon>
              </template>
            </v-expansion-panel-header>
            <v-expansion-panel-content>
              <ul class="my-3">
                <template v-for="scope in app.scopes">
                  <li :key="scope.name">
                    <b>{{ scope.name }}</b>
                    : {{ scope.description }}
                  </li>
                </template>
              </ul>
            </v-expansion-panel-content>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-col>
      <v-col cols="6">
        <v-btn block tile color="primary" @click="allow">Allow</v-btn>
      </v-col>
      <v-col cols="6">
        <v-btn block tile color="secondary" @click="deny">Deny</v-btn>
      </v-col>
    </v-row>
    <v-row v-if="state === 1">
      <v-col cols="12">
        <p class="title font-weight-light text-center">
          Permissions denied.
          <br />
          You can safely close this page.
        </p>
      </v-col>
    </v-row>
    <v-row v-if="state === 2">
      <v-col cols="12">
        <p class="title font-weight-light text-center">
          <b>Permissions granted.</b>
          <br />
          You can now safely close this page.
        </p>
      </v-col>
    </v-row>
    <v-snackbar v-model="registrationError" multi-line>
      {{ errorMessage }}
      <v-btn color="red" text @click="registrationError = false">Close</v-btn>
    </v-snackbar>
  </v-container>
</template>
<script>
import gql from "graphql-tag"
import { onLogin } from "../../vue-apollo"
import debounce from "lodash.debounce"
export default {
  name: "AuthorizeApp",
  apollo: {
    app: {
      query() {
        return gql` query { app( id: "${this.appId}") { id name redirectUrl scopes {name description} } } `
      },
      skip() {
        return this.appId === null
      },
      result({ data, loading, networkStatus }) {
        if (data.app.firstparty) {
          let redirectUrl =
            data.app.redirectUrl === "self" ? "/" : data.app.redirectUrl
          try {
            window.location = `${redirectUrl}?access_code=${this.accessCode}`
          } catch (err) {
            // Fetch?
          }
        }
      }
    }
  },
  data: () => ({
    state: 0,
    currentUrl: window.location.origin,
    panel: [0],
    registrationError: false,
    errorMessage: "",
    appId: null,
    app: {
      name: null,
      author: null,
      firstparty: null,
      scopes: []
    },
    token: null,
    accessCode: null
  }),
  mounted() {
    let urlParams = new URLSearchParams(window.location.search)
    this.appId = urlParams.get("appId") || "spklwebapp"
    this.accessCode = urlParams.get("access_code")
    if (!this.accessCode) {
      this.$router.push({
        name: "Login",
        query: {
          appId: urlParams.get("appId")
        }
      })
      return
    }
  },
  methods: {
    async deny() {
      this.state = 1
      window.history.replaceState({}, document.title, "/auth/finalize")
      fetch(`${this.app.redirectUrl}?success=false`, {
        method: "GET"
      })
        .then()
        .catch()
    },
    async allow() {
      this.state = 2
      if (this.app.redirectUrl === "self")
        window.location = `${location.origin}/?access_code=${this.accessCode}`
      else {
        try {
          window.location = `${this.app.redirectUrl}?access_code=${this.accessCode}`
        } catch (err) {
          fetch(`${this.app.redirectUrl}?access_code=${this.accessCode}`, {
            method: "GET"
          })
            .then()
            .catch()
        }
      }
    }
  }
}
</script>
