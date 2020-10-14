<template>
  <v-container v-if="hasLocalStrategy" fluid>
    <v-form ref="form">
      <v-row style="margin-top: -10px" dense>
        <v-col cols="12">
          <v-text-field
            v-model="form.email"
            label="your email"
            :rules="validation.emailRules"
            solo
          ></v-text-field>
        </v-col>
        <v-col cols="12">
          <v-text-field
            v-model="form.password"
            label="password"
            type="password"
            :rules="validation.passwordRules"
            solo
            style="margin-top: -12px"
          ></v-text-field>
          <v-btn
            block
            large
            color="primary"
            style="top: -22px"
            @click="loginUser"
          >
            Log in
          </v-btn>
          <p class="text-center">
            <v-btn
              text
              small
              block
              color="primary"
              :to="{
                name: 'Register',
                query: {
                  appId: $route.query.appId,
                  challenge: $route.query.challenge,
                  suuid: $route.query.suuid
                }
              }"
            >
              Create Account
            </v-btn>
          </p>
        </v-col>
      </v-row>
    </v-form>
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
import crs from "crypto-random-string"

export default {
  name: "Login",
  apollo: {
    serverInfo: {
      query: gql`
        query {
          serverInfo {
            name
            company
            adminContact
            termsOfService
            scopes {
              name
              description
            }
            authStrategies {
              id
              name
              color
              icon
              url
            }
          }
        }
      `
    }
  },
  data: () => ({
    serverInfo: { authStrategies: [] },
    form: { email: null, password: null },
    validation: {
      passwordRules: [(v) => !!v || "Required"],
      emailRules: [
        (v) => !!v || "E-mail is required",
        (v) => /.+@.+\..+/.test(v) || "E-mail must be valid"
      ]
    },
    registrationError: false,
    errorMessage: "",
    appId: null,
    serverApp: null,
    suuid: null
  }),
  computed: {
    hasLocalStrategy() {
      return (
        this.serverInfo.authStrategies.findIndex((s) => s.id === "local") !== -1
      )
    }
  },
  mounted() {
    let urlParams = new URLSearchParams(window.location.search)
    let appId = urlParams.get("appId")
    let challenge = urlParams.get("challenge")
    let suuid = urlParams.get("suuid")
    this.suuid = suuid

    if (!appId) this.appId = "spklwebapp"
    else this.appId = appId

    if (!challenge && this.appId === "spklwebapp") {
      this.challenge = crs({ length: 10 })
      localStorage.setItem("appChallenge", this.challenge)
    } else if (challenge) {
      this.challenge = challenge
    }
  },
  methods: {
    async loginUser() {
      try {
        let valid = this.$refs.form.validate()
        if (!valid) throw new Error("Form validation failed")

        let user = {
          email: this.form.email,
          password: this.form.password
        }

        if (this.suuid) user.suuid = this.suuid

        let res = await fetch(
          `/auth/local/login?appId=${this.appId}&challenge=${this.challenge}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            redirect: "follow", // obvs not working
            body: JSON.stringify(user)
          }
        )

        if (res.redirected) {
          window.location = res.url
        }

        if (!res.ok) {
          throw new Error("Login failed")
        }
      } catch (err) {
        this.errorMessage = err.message
        this.registrationError = true
      }
    }
  }
}
</script>
