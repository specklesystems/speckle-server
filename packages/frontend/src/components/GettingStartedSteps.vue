<template>
  <div>
    <v-card class="elevation-10 rounded-lg">
      <v-btn
        v-if="onboarding < 3"
        small
        text
        class="white--grey"
        style="position: absolute; top: 5px; right: 5px; z-index: 1002"
        @click="skip"
      >
        Skip
      </v-btn>

      <v-window v-model="onboarding" class="pb-3">
        <v-window-item>
          <v-card class="transparent elevation-0 text-center" color="transparent">
            <v-img
              class="white--text align-end mb-3"
              height="200px"
              src="@/assets/onboardingsplash.png"
            ></v-img>
            <v-card-title class="display-1 justify-center mb-5">
              👋 Welcome to Speckle!
            </v-card-title>
            <v-card-subtitle class="subtitle-1 justify-center mb-5">
              The Open Data Infrastructure for the Built Environment.
            </v-card-subtitle>
            <v-card-text class="body-1 text--primary">
              <p>
                Engineers, designers, hackers and entire organizations rely on us for
                interoperability, automation and collaboration to deliver better buildings, faster.
                <br />
                Please select your role:
              </p>
            </v-card-text>
            <v-container fluid>
              <v-row dense>
                <v-col cols="5" offset="1">
                  <v-hover>
                    <v-card
                      slot-scope="{ hover }"
                      height="100%"
                      :class="`pa-5 elevation-${hover ? 10 : 10}`"
                      @click="nextUser"
                    >
                      <h1>👷‍♀️</h1>
                      <v-card-title class="justify-center">AEC Person</v-card-title>
                      <v-card-subtitle class="justify-center">
                        Architect, engineer, BIM/project manager...
                      </v-card-subtitle>
                    </v-card>
                  </v-hover>
                </v-col>
                <v-col cols="5" offset="0">
                  <v-hover>
                    <v-card
                      slot-scope="{ hover }"
                      height="100%"
                      :class="`pa-5 elevation-${hover ? 10 : 10}`"
                      @click="nextDev"
                    >
                      <h1>👩‍💻</h1>
                      <v-card-title class="justify-center">AEC Developer</v-card-title>
                      <v-card-subtitle class="justify-center">
                        Software engineer, computational designer, hacker
                      </v-card-subtitle>
                    </v-card>
                  </v-hover>
                </v-col>
              </v-row>
            </v-container>
            <p class="my-7"><strong>Let us give you a quick tour! 🙋‍♂️</strong></p>
          </v-card>
        </v-window-item>

        <v-window-item v-if="isDev">
          <v-card class="transparent elevation-0 text-center" color="transparent">
            <v-img
              class="white--text align-end mb-3"
              height="200px"
              src="@/assets/onboarding_connectors_dev.png"
            ></v-img>
            <v-card-title class="display-1 justify-center mb-5">🧰 Our toolset</v-card-title>
            <v-card-subtitle class="subtitle-1 justify-center mb-5">
              Is here to push the AEC industry forward
            </v-card-subtitle>
            <v-card-text class="body-1 text--primary">
              <p>
                Use our
                <b>connectors, SDKs, APIs and tools</b>
                to get in control of
                <i>your data.</i>
                Whether you are writing new integrations, custom workflows or creating brand new
                apps on top of Speckle, we're here to support you!
              </p>
              <p>
                Get started sending data into Speckle by installing our connectos and setting up
                your accounts with our
                <b>Desktop Manager 👇</b>
              </p>
              <v-btn elevation="10" class="my-4" rounded color="primary" @click="downloadManager">
                <v-icon small class="mr-4">mdi-download</v-icon>
                Install connectors
              </v-btn>
            </v-card-text>
          </v-card>
        </v-window-item>

        <v-window-item v-else>
          <v-card class="transparent elevation-0 text-center" color="transparent">
            <v-img
              class="white--text align-end mb-3"
              height="200px"
              src="@/assets/onboarding_connectors.png"
            ></v-img>
            <v-card-title class="display-1 justify-center mb-5">🔌 Connectors</v-card-title>
            <v-card-subtitle class="subtitle-1 justify-center mb-5">
              Are plugins for design and analysis software.
            </v-card-subtitle>
            <v-card-text class="body-1 text--primary">
              <p>
                Say goodbye to files! Our
                <b>connectors</b>
                let you
                <b>exchange</b>
                geometry and BIM data dirctly from the tools you use.
              </p>
              <p>
                Install all the connectors you need and manage your accounts with our
                <b>Desktop Manager 👇</b>
              </p>
              <v-btn elevation="10" class="my-4" rounded color="primary" @click="downloadManager">
                <v-icon small class="mr-4">mdi-download</v-icon>
                Install connectors
              </v-btn>

              <v-expansion-panels flat class="mt-2 text-center">
                <v-expansion-panel>
                  <v-expansion-panel-header class="text-center d-inline">
                    <template #actions>
                      <v-icon class="icon">$expand</v-icon>
                    </template>
                    <div class="text-center caption">Having problems?</div>
                  </v-expansion-panel-header>
                  <v-expansion-panel-content class="body-2">
                    <p>
                      Cannot set up your account? Try adding it from the web:
                      <v-btn small text color="primary" @click="addAccount">Add Account</v-btn>
                    </p>
                    <p>
                      Having issues installing the connectors? Check out our docs:
                      <v-btn
                        small
                        text
                        color="primary"
                        href="https://speckle.guide/user/manager.html"
                        target="_blank"
                      >
                        User Guide
                      </v-btn>
                    </p>
                  </v-expansion-panel-content>
                </v-expansion-panel>
              </v-expansion-panels>
            </v-card-text>
          </v-card>
        </v-window-item>

        <v-window-item v-if="isDev">
          <v-card class="transparent elevation-0 text-center" color="transparent">
            <v-img
              class="white--text align-end mb-3"
              height="200px"
              src="@/assets/onboarding_streams.png"
            ></v-img>
            <v-card-title class="display-1 justify-center mb-5">
              🐙 Git & DevOps for AEC
            </v-card-title>
            <v-card-subtitle class="subtitle-1 justify-center mb-5">
              Welcome to the future of the AEC industry!
            </v-card-subtitle>
            <v-card-text class="body-1 text--primary">
              <p>
                Speckle ships with a
                <b>version control system,</b>
                trigger custom workflows and pipelines and never lose anything.
              </p>
              <p>
                Also, Speckle talks
                <i>data, not files!</i>
                Store it where you want, and access it when you need 🔓
              </p>
            </v-card-text>
          </v-card>
        </v-window-item>
        <v-window-item v-else>
          <v-card class="transparent elevation-0 text-center" color="transparent">
            <v-img
              class="white--text align-end mb-3"
              height="200px"
              src="@/assets/onboarding_streams.png"
            ></v-img>
            <v-card-title class="display-1 justify-center mb-5">🌊 Streams</v-card-title>
            <v-card-subtitle class="subtitle-1 justify-center mb-5">
              Are collections of data inside Speckle.
            </v-card-subtitle>
            <v-card-text class="body-1 text--primary">
              <p>
                You can see a
                <b>stream</b>
                as a folder, a project or a repository.
              </p>
              <p>
                Data in a stream is stored in
                <b>commits,</b>
                which are snapshots of data in time. Every time you send to Speckle from a
                connector, a commit is created.
              </p>
              <p>
                Commits can also be organized in
                <b>branches,</b>
                for instace, to have multiple design options or to store data by discipline. The
                dafault branch is called
                <i>main</i>
                .
              </p>
            </v-card-text>
          </v-card>
        </v-window-item>
        <v-window-item v-if="isDev">
          <v-card class="transparent elevation-0 text-center" color="transparent">
            <v-card-title class="display-1 justify-center my-5">🏃‍♀️ Start Hacking!</v-card-title>
            <v-card-subtitle class="subtitle-1 justify-center mb-5">
              Time to make the most of
              <b>your</b>
              data!
            </v-card-subtitle>
            <v-card-text class="body-1 text--primary">
              <p>
                You can now start developing with Speckle and create your connectors, apps or custom
                workflows.
              </p>
              <p>We have put together a series of resources that you might find useful:</p>
            </v-card-text>
            <v-container fluid>
              <v-row dense>
                <v-col v-for="(tutorial, i) in tutorialsDev" :key="i" cols="6">
                  <v-hover>
                    <v-card
                      slot-scope="{ hover }"
                      :class="`elevation-${hover ? 10 : 0}`"
                      :href="tutorial.link"
                      target="_blank"
                    >
                      <v-img
                        class="white--text align-end"
                        height="150"
                        gradient="to bottom, rgba(36,100,235,.2), rgba(36,100,235,.7)"
                        :src="require('@/assets/' + tutorial.image)"
                      >
                        <v-card-title class="justify-center">
                          {{ tutorial.title }}
                        </v-card-title>
                      </v-img>
                    </v-card>
                  </v-hover>
                </v-col>
              </v-row>
            </v-container>

            <v-btn elevation="10" class="my-4" rounded color="primary" @click="finish">
              <!-- <v-icon small class="mr-4">mdi-download</v-icon> -->
              Finish & go to the web app
            </v-btn>
          </v-card>
        </v-window-item>
        <v-window-item v-else>
          <v-card class="transparent elevation-0 text-center" color="transparent">
            <v-card-title class="display-1 justify-center my-5">🏃‍♀️ Get Started!</v-card-title>
            <v-card-subtitle class="subtitle-1 justify-center mb-5">
              Time to make the most of
              <b>your</b>
              data!
            </v-card-subtitle>
            <v-card-text class="body-1 text--primary">
              <p>
                You can now start creating your own workflows for automation, interoperaility or
                collaboration using Speckle!
              </p>
              <p>We have put together a series of tutorials that you might find useful:</p>
            </v-card-text>
            <v-container fluid>
              <v-row dense>
                <v-col v-for="(tutorial, i) in tutorials" :key="i" cols="6">
                  <v-hover>
                    <v-card
                      slot-scope="{ hover }"
                      :class="`elevation-${hover ? 10 : 0}`"
                      :href="tutorial.link"
                      target="_blank"
                    >
                      <v-img
                        class="white--text align-end"
                        height="150"
                        gradient="to bottom, rgba(36,100,235,.2), rgba(36,100,235,.7)"
                        :src="require('@/assets/' + tutorial.image)"
                      >
                        <v-card-title class="justify-center">
                          {{ tutorial.title }}
                        </v-card-title>
                      </v-img>
                    </v-card>
                  </v-hover>
                </v-col>
              </v-row>
            </v-container>

            <v-btn elevation="10" class="my-4" rounded color="primary" @click="finish">
              <!-- <v-icon small class="mr-4">mdi-download</v-icon> -->
              Finish & go to the web app
            </v-btn>
          </v-card>
        </v-window-item>
      </v-window>
      <v-card-actions v-if="onboarding > 0" class="justify-space-between pb-7">
        <v-btn text @click="prev">
          <v-icon>mdi-chevron-left</v-icon>
        </v-btn>
        <v-item-group v-model="onboarding" class="text-center" mandatory>
          <v-item v-for="n in length" :key="`btn-${n}`" v-slot="{ active, toggle }">
            <v-btn :input-value="active" icon @click="toggle">
              <v-icon small>mdi-record</v-icon>
            </v-btn>
          </v-item>
        </v-item-group>
        <v-btn :disabled="onboarding == 3" text @click="next">
          <v-icon>mdi-chevron-right</v-icon>
        </v-btn>
      </v-card-actions>
    </v-card>

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
    length: 4,
    onboarding: 0,
    newStreamDialog: false,
    hasClickedDownload: false,
    hasClickedAddAccount: 0,
    isDev: false,
    tutorials: [
      {
        title: 'Create Revit models from Rhino',
        image: 'rhino-revit-tutorial.png',
        link: 'https://speckle.guide/user/interop-rhino-revit.html'
      },
      {
        title: 'View 3d models online',
        image: 'viewer-tutorial.png',
        link: 'https://speckle.guide/user/web.html#_3d-viewer'
      },
      {
        title: 'Analyse Revit models in Grasshopper',
        image: 'revit-gh-tutorial.png',
        link: 'https://speckle.guide/user/interop-revit-gh.html'
      },
      {
        title: 'See more in our tutorials portal!',
        image: 'tutorials.png',
        link: 'https://speckle.guide/user/tutorials.html'
      }
    ],
    tutorialsDev: [
      {
        title: 'Writing your own connector',
        image: 'connector-tutorial.png',
        link: 'https://speckle.guide/dev/connectors-dev.html'
      },
      {
        title: 'Writing your own app',
        image: 'app-tutorial.png',
        link: 'https://speckle.guide/dev/apps.html'
      },
      {
        title: 'Using the GraphQL API',
        image: 'api-tutorial.png',
        link: 'https://speckle.guide/dev/server-graphql-api.html'
      },
      {
        title: 'See more content and resources in our dev docs!',
        image: 'tutorials.png',
        link: 'https://speckle.guide/dev/'
      }
    ]
  }),
  computed: {
    rootUrl() {
      return window.location.origin
    }
  },
  mounted() {
    this.$matomo && this.$matomo.trackEvent('onboarding', 'start')
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
      this.$router.push('/')
    },
    prev() {
      this.onboarding--
      this.$matomo && this.$matomo.trackPageView(`onboarding/step-${this.onboarding}`)
    },
    next() {
      this.onboarding++
      this.$matomo && this.$matomo.trackPageView(`onboarding/step-${this.onboarding}`)
    },
    nextUser() {
      this.isDev = false
      this.next()
    },
    nextDev() {
      this.isDev = true
      this.next()
    },
    downloadManager() {
      this.hasClickedDownload = true
      this.$matomo && this.$matomo.trackPageView(`onboarding/managerdownload`)
      this.$matomo && this.$matomo.trackEvent('onboarding', 'managerdownload')
      window.open('https://releases.speckle.dev/manager/SpeckleManager%20Setup.exe', '_blank')
    },
    addAccount() {
      this.hasClickedAddAccount++
      this.$matomo && this.$matomo.trackPageView(`onboarding/accountadd`)
      this.$matomo && this.$matomo.trackEvent('onboarding', 'accountadd')
      window.open(`speckle://accounts?add_server_account=${this.rootUrl}`, '_blank')
    }
  }
}
</script>
