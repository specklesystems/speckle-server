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
        <v-col xs="6" sm="6">
          <v-text-field
            v-model="form.firstName"
            label="first name"
            :rules="validation.nameRules"
            solo
            style="margin-top: -12px"
          ></v-text-field>
        </v-col>
        <v-col xs="6" sm="6">
          <v-text-field
            v-model="form.lastName"
            label="last name"
            :rules="validation.nameRules"
            solo
            style="margin-top: -12px"
          ></v-text-field>
        </v-col>
        <v-col cols="12" sm="12">
          <v-text-field
            v-model="form.company"
            label="company/team"
            :rules="validation.companyRules"
            solo
            style="margin-top: -12px"
          ></v-text-field>
        </v-col>
        <v-col cols="12" sm="6">
          <v-text-field
            v-model="form.password"
            label="password"
            type="password"
            :rules="validation.passwordRules"
            solo
            style="margin-top: -12px"
            @keydown="debouncedPwdTest"
          ></v-text-field>
        </v-col>
        <v-col cols="12" sm="6">
          <v-text-field
            v-model="form.passwordConf"
            label="confirm password"
            type="password"
            :rules="validation.passwordRules"
            solo
            style="margin-top: -12px"
          ></v-text-field>
        </v-col>
        <v-col cols="12" class="py-2 px-2" style="margin-top: -18px">
          <v-row no-gutters align="center">
            <!-- <v-col cols='3' class='caption flex-shrink-1 flex-grow-0'>Strength:</v-col> -->
            <v-col
              cols="12"
              class="flex-grow-1 flex-shrink-0"
              style="min-width: 100px; max-width: 100%"
            >
              <v-progress-linear
                v-show="true"
                v-model="passwordStrength"
                height="5"
                class="mt-1 mb-0"
                :color="`${
                  passwordStrength >= 75
                    ? 'green'
                    : passwordStrength >= 50
                    ? 'orange'
                    : 'red'
                }`"
              ></v-progress-linear>
            </v-col>
            <v-col cols="12" class="caption text-center mt-3">
              {{
                this.pwdSuggestions
                  ? this.pwdSuggestions
                  : this.form.password
                  ? "Looks good."
                  : "Password strength"
              }}
              <span v-if="this.form.password !== this.form.passwordConf">
                <b>Passwords do not match.</b>
              </span>
            </v-col>
          </v-row>
        </v-col>
        <v-col cols="12">
          <v-btn
            block
            large
            color="primary"
            style="margin-top: -0px"
            @click="registerUser"
          >
            Sign Up
          </v-btn>
          <p class="text-center">
            <v-btn
              text
              small
              block
              color="primary"
              :to="{
                name: 'Login',
                query: {
                  appId: $route.query.appId,
                  challenge: $route.query.challenge,
                  suuid: $route.query.suuid
                }
              }"
              class="mt-5"
            >
              Login
            </v-btn>
          </p>
        </v-col>
      </v-row>
      <v-snackbar v-model="registrationError" multi-line>
        {{ errorMessage }}
        <v-btn color="red" text @click="registrationError = false">Close</v-btn>
      </v-snackbar>
    </v-form>
  </v-container>
</template>
<script>
import gql from "graphql-tag"
import { onLogin } from "../../vue-apollo"
import debounce from "lodash.debounce"
import crs from "crypto-random-string"

export default {
  name: "Registration",
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
  computed: {
    hasLocalStrategy() {
      return (
        this.serverInfo.authStrategies.findIndex((s) => s.id === "local") !== -1
      )
    }
  },
  methods: {
    debouncedPwdTest: debounce(async function () {
      let result = await this.$apollo.query({
        query: gql` query{ userPwdStrength(pwd:"${this.form.password}")}`
      })
      this.passwordStrength = result.data.userPwdStrength.score * 25
      this.pwdSuggestions = result.data.userPwdStrength.feedback.suggestions[0]
    }, 1000),
    async registerUser() {
      try {
        let valid = this.$refs.form.validate()
        if (!valid) throw new Error("Form validation failed")
        if (this.form.password !== this.form.passwordConf)
          throw new Error("Passwords do not match")
        if (this.passwordStrength < 3) throw new Error("Password too weak")

        let user = {
          email: this.form.email,
          company: this.form.company,
          password: this.form.password,
          name: `${this.form.firstName} ${this.form.lastName}`
        }

        if (this.suuid) user.suuid = this.suuid

        let res = await fetch(
          `/auth/local/register?appId=${this.appId}&challenge=${this.challenge}`,
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
      } catch (err) {
        this.errorMessage = err.message
        this.registrationError = true
      }
    }
  },
  data: () => ({
    serverInfo: { authStrategies: [] },
    form: {
      email: null,
      firstName: null,
      lastName: null,
      company: null,
      password: null,
      passwordConf: null
    },
    registrationError: false,
    errorMessage: "",
    validation: {
      companyRules: [(v) => !!v || "Required"],
      passwordRules: [(v) => !!v || "Required"],
      nameRules: [
        (v) => !!v || "Required",
        (v) => (v && v.length <= 10) || "Name must be less than 10 characters"
      ],
      emailRules: [
        (v) => !!v || "E-mail is required",
        (v) => /.+@.+\..+/.test(v) || "E-mail must be valid"
      ]
    },
    passwordStrength: 1,
    pwdSuggestions: null,
    appId: null,
    challenge: null,
    suuid: null
  }),
  mounted() {
    let urlParams = new URLSearchParams(window.location.search)
    let appId = urlParams.get("appId")
    let challenge = urlParams.get("challenge")
    let suuid = urlParams.get("suuid")

    this.suuid = suuid
    console.log(this.suuid)
    if (!appId) this.appId = "spklwebapp"
    else this.appId = appId

    if (!challenge && this.appId === "spklwebapp") {
      this.challenge = crs({ length: 10 })
      localStorage.setItem("appChallenge", this.challenge)
    } else if (challenge) {
      this.challenge = challenge
    }
  }
}
</script>
