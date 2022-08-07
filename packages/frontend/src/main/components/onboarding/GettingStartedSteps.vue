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
          <v-card
            class="transparent elevation-0 text-center"
            color="transparent"
            align="start"
          >
            <v-img
              class="align-start mb-3"
              src="@/assets/onboarding-1.png"
              :aspect-ratio="16 / 9"
            >
              <template #sources>
                <source srcset="@/assets/onboarding-1.webp" />
              </template>
              <v-card-text class="body-1 text--primary text-left pa-10">
                <v-row>
                  <v-col cols="6">
                    <h1>Connecting your data</h1>
                  </v-col>
                </v-row>
                <v-row>
                  <v-col cols="6" class="mt-5 mb-12">
                    <p>
                      We've developed a collection of
                      <b>plugins</b>
                      - our speckle
                      <b>connectors</b>
                      - to help you extract your 3D objects and all their properties
                      from your desktop application.
                    </p>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-img>
          </v-card>
        </v-window-item>

        <v-window-item>
          <v-card
            class="transparent elevation-0 text-center"
            color="transparent"
            align="start"
          >
            <v-img
              class="align-start mb-3"
              src="@/assets/onboarding-2.png"
              :aspect-ratio="16 / 9"
            >
              <template #sources>
                <source srcset="@/assets/onboarding-2.webp" />
              </template>
              <v-card-text class="body-1 text--primary text-left pa-10">
                <v-row>
                  <v-col cols="10">
                    <h1>Sending data to Speckle</h1>
                  </v-col>
                </v-row>
                <v-row>
                  <v-col cols="6" class="mt-5 mb-12">
                    <p>
                      Every time you send your 3D objects out of your application, they
                      are captured as a
                      <b>"commit"</b>
                      that includes a description, the sender, timestamp, and source
                      application.
                    </p>
                  </v-col>
                </v-row>
                <v-row justify="end" class="mt-12 text-right">
                  <spacer />
                  <v-col cols="5">
                    <p>
                      Think of it like a
                      <b>snapshot</b>
                      of your current model state!
                    </p>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-img>
          </v-card>
        </v-window-item>

        <v-window-item>
          <v-card
            class="transparent elevation-0 text-center"
            color="transparent"
            align="start"
          >
            <v-img
              class="align-start mb-3"
              src="@/assets/onboarding-3.png"
              :aspect-ratio="16 / 9"
            >
              <template #sources>
                <source srcset="@/assets/onboarding-3.webp" />
              </template>
              <v-card-text class="body-1 text--primary text-left pa-10">
                <v-row>
                  <v-col cols="8">
                    <h1>Organizing your data</h1>
                  </v-col>
                </v-row>
                <v-row>
                  <v-col cols="6" class="mt-5 mb-12">
                    <p>
                      All data objects sent to Speckle are stored in
                      <b>streams</b>
                      that you can create and customize!
                    </p>
                    <p>
                      By default, every stream has a
                      <b>main branch</b>
                      where every commit is stored.
                    </p>
                  </v-col>
                </v-row>
                <v-row justify="end" class="mt-12 text-right">
                  <spacer />
                  <v-col cols="5">
                    <p>
                      Create
                      <b>additional</b>
                      branches in your stream if you want to store parallel collections
                      of data.
                    </p>
                    <p>Use branches to keep your stream organization tidy!</p>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-img>
          </v-card>
        </v-window-item>

        <v-window-item>
          <v-card
            class="transparent elevation-0 text-center"
            color="transparent"
            align="start"
          >
            <v-img
              class="align-start mb-3"
              src="@/assets/onboarding-4.png"
              :aspect-ratio="16 / 9"
            >
              <template #sources>
                <source srcset="@/assets/onboarding-4.webp" />
              </template>
              <v-card-text class="body-1 text--primary text-left pa-10">
                <v-row>
                  <v-col cols="8">
                    <h1>Viewing your data</h1>
                  </v-col>
                </v-row>
                <v-row>
                  <v-col cols="8" class="mt-5">
                    <p>
                      Want to explore all of your 3D data in your
                      <b>web browser,</b>
                      or see who's collaborating with you on your streams?
                    </p>
                    <p>
                      Speckle Web gives you access to all your information and
                      <b>activity,</b>
                      with a data viewer that lets you filter and customize your objects
                      by their properties.
                    </p>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-img>
          </v-card>
        </v-window-item>

        <v-window-item>
          <v-card
            class="transparent elevation-0 text-center"
            color="transparent"
            align="start"
          >
            <v-img
              class="align-start mb-3"
              src="@/assets/onboarding-5.png"
              :aspect-ratio="16 / 9"
            >
              <template #sources>
                <source srcset="@/assets/onboarding-5.webp" />
              </template>
              <v-card-text class="body-1 text--primary text-left pa-10">
                <v-row>
                  <v-col cols="8">
                    <h1>Retrieving data from Speckle</h1>
                  </v-col>
                </v-row>
                <v-row>
                  <v-col cols="5" class="mt-5 mb-12">
                    <p>
                      Get your original 3D data back into your application with our
                      connectors - just select the commits you want to receive!
                    </p>
                  </v-col>
                </v-row>
                <v-row justify="end" class="mt-12 text-right">
                  <spacer />
                  <v-col cols="4">
                    <p>Or consume it programmatically with our APIs and SDKs!</p>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-img>
          </v-card>
        </v-window-item>

        <v-window-item>
          <v-card class="transparent elevation-0 text-center" color="transparent">
            <v-card-title class="display-1 justify-center my-5">
              🏃‍♀️ Get Started!
            </v-card-title>
            <v-card-subtitle class="subtitle-1 justify-center mb-5">
              Time to make the most of
              <b>your</b>
              data!
            </v-card-subtitle>
            <v-card-text class="body-1 text--primary">
              <p>
                You can now start creating your own workflows for automation,
                interoperaility or collaboration using Speckle!
              </p>
              <p>
                We have put together a series of tutorials that you might find useful:
              </p>
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
          </v-card>
        </v-window-item>
      </v-window>
      <v-card-actions class="justify-space-between pb-7">
        <v-btn text :disabled="onboarding == 0" rounded class="pr-4" @click="prev">
          <v-icon>mdi-chevron-left</v-icon>
          BACK
        </v-btn>
        <v-item-group v-model="onboarding" class="text-center" mandatory>
          <v-item v-for="n in length" :key="`btn-${n}`" v-slot="{ active, toggle }">
            <v-btn :input-value="active" icon @click="toggle">
              <v-icon small>mdi-record</v-icon>
            </v-btn>
          </v-item>
        </v-item-group>
        <v-btn color="primary" rounded elevation="10" class="pl-4" @click="next">
          {{ onboarding == length - 1 ? 'FINISH' : 'NEXT' }}
          <v-icon>mdi-chevron-right</v-icon>
        </v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>
<script>
import { AppLocalStorage } from '@/utils/localStorage'

export default {
  data: () => ({
    length: 5,
    onboarding: 0,
    newStreamDialog: false,
    hasClickedDownload: false,
    hasClickedAddAccount: 0,
    isDev: false,
    tutorials: [
      {
        title: 'Create Revit models from Rhino',
        image: 'rhino-revit-tutorial.png',
        link: 'https://speckle.systems/tutorials/getting-rhino-geometry-into-revit/'
      },
      {
        title: 'Map AutoCAD Blocks to Revit families with Dynamo',
        image: 'viewer-tutorial.png',
        link: 'https://speckle.systems/tutorials/mapping-autocad-blocks-to-revit-families-via-dynamo/'
      },
      {
        title: 'Analyse Revit models in Grasshopper',
        image: 'revit-gh-tutorial.png',
        link: 'https://speckle.systems/tutorials/process-revit-bim-models-in-grasshopper/'
      },
      {
        title: 'See more in our tutorials portal!',
        image: 'tutorials.png',
        link: 'https://speckle.systems/tutorials/'
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
    this.$mixpanel.track('Web Onboarding', {
      step: this.onboarding,
      type: 'action'
    })
  },
  methods: {
    skip() {
      AppLocalStorage.set('onboarding', 'skipped')
      this.$router.push('/')
    },
    finish() {
      AppLocalStorage.set('onboarding', 'complete')
      this.$router.push('/')
    },
    prev() {
      this.onboarding--
      this.$mixpanel.track('Web Onboarding', {
        step: this.onboarding,
        type: 'action'
      })
    },
    next() {
      if (this.onboarding === this.length - 1) {
        this.finish()
      }
      this.onboarding++
      this.$mixpanel.track('Web Onboarding', {
        step: this.onboarding,
        type: 'action'
      })
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
