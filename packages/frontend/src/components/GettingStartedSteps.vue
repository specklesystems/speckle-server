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
            <v-card-title class="display-1 justify-center mb-5">🧰 Our toolkit</v-card-title>
            <v-card-subtitle class="subtitle-1 justify-center mb-5">
              From AEC developers, for AEC developers
            </v-card-subtitle>
            <v-card-text class="body-1 text--primary">
              <p>
                Use our
                <b>connectors, SDKs, APIs and tools</b>
                to get in control of
                <i>your data.</i>
              </p>
              <p>
                Whether you are
                <b>writing new integrations, custom workflows or creating brand new apps</b>
                on top of Speckle, our toolkit is here to take care of the low level stuff, so that
                you can focus on the fun bits.
              </p>
              <p>
                From user permission management, data extraction or 3d model online visualization,
                we've got you covered!
              </p>
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
              Say goodbye to files!
            </v-card-subtitle>
            <v-card-text class="body-1 text--primary">
              <p></p>
              <p>
                <b>Connectors</b>
                are plugins for design and analysis software, they let you
                <b>exchange</b>
                geometry and BIM data directly from the tools you use.
              </p>
              <p>
                Install our connectors and you'll instantly be able to
                <b>share your models and data</b>
                with others or
                <b>access it from the web,</b>
                or
                <b>load it into other supported software</b>
                .
              </p>
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
                we're bringing the tech industry best practices to AEC. You'll soon also be able to
                <b>trigger custom workflows and pipelines</b>
                directly from Speckle!
              </p>
              <p>
                Also, Speckle talks
                <i>data, not files!</i>
                <br />
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
              A new way of working together
            </v-card-subtitle>
            <v-card-text class="body-1 text--primary">
              <p>
                <b>Streams</b>
                are collections of data inside Speckle. You can see a stream as a folder, a project
                or a repository.
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
                for instance, to have multiple design options or to store data by discipline. The
                default branch is called
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
  </div>
</template>
<script>
export default {
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
  computed: {},
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
    }
  }
}
</script>
