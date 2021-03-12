<template>
  <div>
    <v-card class="elevation-10 rounded-lg">
      <v-img class="white--text align-end" height="200px" src="@/assets/onboardingsplash.png">
        <v-card-title class="">Speckle Onboarding {{ onboarding + 1 }} / 4</v-card-title>
      </v-img>
      <v-window v-model="onboarding" class="py-3">
        <v-window-item>
          <v-card class="transparent elevation-0" color="transparent">
            <v-card-title>Welcome!</v-card-title>
            <v-card-text class="body-1">
              <p>
                Next, we will guide you through setting up Speckle on your computer. If you've done
                this before, feel free to skip this wizard!
              </p>
              <p>The next steps in a nutshell:</p>
              <ul>
                <li>Installing the Speckle Manager</li>
                <li>Setting up your account</li>
                <li>Creating your first stream</li>
              </ul>
            </v-card-text>
            <v-card-actions class="justify-center">
              <v-btn block color="primary" @click="next">
                Let's go
                <v-icon>mdi-chevron-right</v-icon>
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-window-item>
        <v-window-item>
          <v-card class="transparent elevation-0" color="transparent">
            <v-card-title>Speckle Manager Installation</v-card-title>
            <v-card-text class="body-1">
              <p>
                Speckle Manager is a desktop application that handles accounts and connectors
                (Rhino, Revit, etc.) on your machine. Once you have downloaded Speckle Manager, go
                ahead and install it. Once you're done, go to the next step!
              </p>
              <p>Note: Currently, we only support Windows.</p>
              <v-btn block depressed class="mb-4" @click="downloadManager">
                <v-icon small class="mr-4">mdi-download</v-icon>
                Download Speckle Manager (WIN)
              </v-btn>
            </v-card-text>
            <v-card-actions class="justify-center">
              <!--               <v-btn small text color="grey" @click="prev">
                <v-icon small>mdi-chevron-left</v-icon>
              </v-btn> -->

              <v-btn color="primary" @click="next">
                Next Step: Accounts
                <v-icon>mdi-chevron-right</v-icon>
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-window-item>

        <v-window-item>
          <v-card class="transparent elevation-0" color="transparent">
            <v-card-title>Account Linking</v-card-title>
            <v-card-text class="body-1">
              <p>
                In order to use the desktop connectors with Speckle, you need to add this account to
                the Speckle Manager. Click the button below to do so. NOTE: You need to have Speckle
                Manager installed first!
              </p>
              <p>
                The authentication process will open several annoying windows, but at the end of the
                process your account should be safely stored on your computer - and usable from
                within all the connectors.
              </p>
              <v-btn block depressed class="mb-4" @click="addAccount">
                <v-icon small class="mr-4">mdi-account-plus</v-icon>
                Add Account Speckle Manager
              </v-btn>
            </v-card-text>
            <v-card-actions class="justify-center">
              <!--              <v-btn small text color="grey" @click="prev">
                <v-icon small>mdi-chevron-left</v-icon>
              </v-btn> -->

              <v-btn color="primary" @click="next">
                Your first stream
                <v-icon>mdi-chevron-right</v-icon>
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-window-item>

        <v-window-item>
          <v-card class="transparent elevation-0" color="transparent">
            <v-card-title>Your First Stream</v-card-title>
            <v-card-text class="body-1">
              <p>
                Streams are the primary way Speckle organizes data. You can see them as a file, a
                part of a file, or a repository. Ultimately, a stream is simply a collection of
                objects with some helpful additional information to manage and retrieve them.
              </p>
              <p>
                A stream also lets you manage permissions: it has a list of collaborators including
                an owner and additional reviewers and contributors which the owner has chosen to
                share the stream with.
              </p>
              <v-btn block depressed color="primary" class="mb-2" @click="newStreamDialog = true">
                Create Your First Stream
              </v-btn>
            </v-card-text>
          </v-card>
        </v-window-item>
      </v-window>
    </v-card>
    <div class="text-center py-4">
      <v-btn small text color="grey" @click="prev" v-show="onboarding!==0">
        <v-icon small>mdi-chevron-left</v-icon>
      </v-btn>
      <v-btn small text @click="skip">
        Skip Onboarding
        <v-icon small style="opacity: 0.5" class="ml-1">mdi-fast-forward</v-icon>
        <!-- <v-icon small>mdi-chevron-right</v-icon> -->
      </v-btn>
    </div>
    <v-dialog v-model="newStreamDialog" max-width="500">
      <stream-new-dialog @created="finish" />
    </v-dialog>
  </div>
</template>
<script>
import StreamNewDialog from '../components/dialogs/StreamNewDialog'

export default {
  components: { StreamNewDialog },
  data: () => ({
    length: 3,
    onboarding: 0,
    newStreamDialog: false
  }),
  computed: {
    rootUrl() {
      return window.location.origin
    }
  },
  methods: {
    skip() {
      this.$matomo && this.$matomo.trackPageView(`onboarding/skip`)
      localStorage.setItem('onboarding', 'skipped')
      this.$router.push('/')
    },
    finish() {
      this.$matomo && this.$matomo.trackPageView(`onboarding/done`)
      localStorage.setItem('onboarding', 'complete')
    },
    prev() {
      this.onboarding--
      this.$matomo && this.$matomo.trackPageView(`onboarding/step-${this.onboarding}`)
    },
    next() {
      this.onboarding++
      this.$matomo && this.$matomo.trackPageView(`onboarding/step-${this.onboarding}`)
    },
    downloadManager() {
      this.$matomo && this.$matomo.trackPageView(`onboarding/managerdownload`)
      window.open('https://releases.speckle.dev/manager/SpeckleManager%20Setup.exe', '_blank')
    },
    addAccount() {
      this.$matomo && this.$matomo.trackPageView(`onboarding/accountadd`)
      window.open(`speckle://accounts?add_server_account=${this.rootUrl}`, '_blank')
    }
  }
}
</script>
