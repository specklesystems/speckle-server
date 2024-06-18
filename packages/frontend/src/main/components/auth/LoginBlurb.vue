<template>
  <v-card class="elevation-0 transparent pa-5 pb-0">
    <v-card-text class="text-h3 text-sm-h4 text-md-h3 primary--text">
      <span class="primary--text">
        <b>
          <!-- display: inline -->
          <a class="text-decoration-none" href="https://speckle.systems" target="_blank"
            >Speckle</a
          >
        </b>
      </span>
      <!-- display: inline -->
      <span class="font-weight-light"
        >, empowering your design and construction data.</span
      >
    </v-card-text>
    <div v-if="!fe2MessagingEnabled">
      <v-card-text class="text-h6 font-weight-regular">
        Speckle helps leading AEC companies freely exchange data between software silos
        and automate design and delivery processes:
        <span class="primary--text text--disabled">
          join 100s of designers, architects, engineers and developers building the
          digital future of AEC.
        </span>
      </v-card-text>
    </div>
    <div v-if="fe2MessagingEnabled" class="px-4">
      <v-divider></v-divider>
      <v-row align="center" justify="center" class="pt-4 pb-5">
        <v-col cols="12" class="pb-0">
          <div class="d-flex align-center">
            <svg
              width="22"
              height="20"
              viewBox="0 0 22 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M8.40123 2.0034C9.55572 0.00228626 12.4439 0.00228554 13.5983 2.0034L20.9527 14.7509C22.1065 16.7509 20.6631 19.2501 18.3541 19.2501H3.64546C1.33649 19.2501 -0.106939 16.7509 1.04691 14.7509L8.40123 2.0034ZM11 7.25C11.4142 7.25 11.75 7.58579 11.75 8V11.75C11.75 12.1642 11.4142 12.5 11 12.5C10.5858 12.5 10.25 12.1642 10.25 11.75V8C10.25 7.58579 10.5858 7.25 11 7.25ZM11 15.5C11.4142 15.5 11.75 15.1642 11.75 14.75C11.75 14.3358 11.4142 14 11 14C10.5858 14 10.25 14.3358 10.25 14.75C10.25 15.1642 10.5858 15.5 11 15.5Z"
                fill="#EAB308"
              />
            </svg>
            <h3 class="text-h6 font-weight-bold ml-1">This is the Legacy Web App</h3>
          </div>
          <p class="mb-0 mt-1 primary--text text--disabled mr-2">
            A better and more powerful web app is replacing this.
          </p>
        </v-col>

        <v-col cols="12" class="d-flex justify-end">
          <v-row align="center" justify="center">
            <v-col cols="12" lg="4" class="d-flex justify-end">
              <v-btn
                href="https://speckle.systems/blog/the-new-way-to-collaborate-in-aec/"
                outlined
                target="_blank"
                block
                class="align-self-center outlined ml-4"
              >
                Learn more
                <v-icon right>mdi-open-in-new</v-icon>
              </v-btn>
            </v-col>
            <v-col cols="12" lg="8" class="d-flex justify-end py-0">
              <v-btn
                :href="migrationMovedTo"
                color="primary"
                block
                class="align-self-center outlined ml-4"
              >
                Go to the new web app
                <v-icon right>mdi-rocket-launch</v-icon>
              </v-btn>
            </v-col>
          </v-row>
        </v-col>
      </v-row>
      <v-divider></v-divider>
    </div>
  </v-card>
</template>
<script>
import { useFE2Messaging } from '@/main/lib/core/composables/server'

export default {
  name: 'LoginBlurb',
  setup() {
    return {
      ...useFE2Messaging()
    }
  }
}
</script>
