<template>
  <div class="elevation-10">
    <portal-target name="nav-bottom">
      <v-list nav dense :class="`pt-0 my-0 pb-0`">
        <v-list-item class="d-flex flex-grow-1 justify-center">
          <v-row dense style="max-width: 350px">
            <v-col v-if="$loggedIn()">
              <v-btn x-small block depressed color="error" @click="signOut()">
                <v-icon x-small class="mr-1">mdi-account-off</v-icon>
                Sign out
              </v-btn>
            </v-col>
            <v-col>
              <v-btn x-small block depressed @click="switchTheme()">
                <v-icon x-small class="mr-1">
                  {{
                    $vuetify.theme.dark
                      ? 'mdi-white-balance-sunny'
                      : 'mdi-weather-night'
                  }}
                </v-icon>
                <!-- {{ $vuetify.theme.dark ? 'mdi-white-balance-sunny' : 'mdi-weather-night' }} -->
              </v-btn>
            </v-col>
            <v-col>
              <v-btn
                x-small
                block
                depressed
                text
                color="primary"
                href="https://speckle.community/new-topic?category=features"
                target="_blank"
              >
                <v-icon x-small class="mr-1">mdi-comment-arrow-right</v-icon>
                Feedback
              </v-btn>
            </v-col>
          </v-row>
        </v-list-item>
      </v-list>
    </portal-target>
  </div>
</template>
<script>
import { signOut } from '@/plugins/authHelpers'
import { setDarkTheme } from '@/main/utils/themeStateManager'

export default {
  methods: {
    signOut() {
      this.$mixpanel.track('Log Out', { type: 'action' })
      signOut()
    },
    switchTheme() {
      this.$vuetify.theme.dark = !this.$vuetify.theme.dark
      setDarkTheme(this.$vuetify.theme.dark, true)

      this.$mixpanel.people.set(
        'Theme Web',
        this.$vuetify.theme.dark ? 'dark' : 'light'
      )
    }
  }
}
</script>
