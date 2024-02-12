<template>
  <v-dialog v-model="dialog" persistent max-width="670px">
    <v-card class="whats-new-dialog">
      <v-card-title class="headline d-flex justify-space-between align-center">
        <h4>New Speckle is Here</h4>
        <v-btn icon @click="dialog = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <v-row no-gutters align="center" justify="space-between" class="pa-6">
        <v-col cols="12" sm="6">image</v-col>
        <v-col cols="12" sm="6" class="pt-4 pt-sm-0 pb-sm-4 pr-8">
          <h2>What’s New?</h2>
          <div class="d-flex align-center py-2">
            <!-- TODO - FIND OUT IF WE CAN USE MDI-STARS-OUTLINE -->
            <svg
              width="26"
              height="26"
              viewBox="0 0 26 26"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g filter="url(#filter0_d_2149_1841)">
                <path
                  d="M10.8132 15.9038L10 18.75L9.1868 15.9038C8.75968 14.4089 7.59112 13.2403 6.09619 12.8132L3.25 12L6.09619 11.1868C7.59113 10.7597 8.75968 9.59112 9.1868 8.09619L10 5.25L10.8132 8.09619C11.2403 9.59113 12.4089 10.7597 13.9038 11.1868L16.75 12L13.9038 12.8132C12.4089 13.2403 11.2403 14.4089 10.8132 15.9038Z"
                  stroke="#3B82F6"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M19.2589 8.71454L19 9.75L18.7411 8.71454C18.4388 7.50533 17.4947 6.56117 16.2855 6.25887L15.25 6L16.2855 5.74113C17.4947 5.43883 18.4388 4.49467 18.7411 3.28546L19 2.25L19.2589 3.28546C19.5612 4.49467 20.5053 5.43883 21.7145 5.74113L22.75 6L21.7145 6.25887C20.5053 6.56117 19.5612 7.50533 19.2589 8.71454Z"
                  stroke="#3B82F6"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M17.8942 20.5673L17.5 21.75L17.1058 20.5673C16.8818 19.8954 16.3546 19.3682 15.6827 19.1442L14.5 18.75L15.6827 18.3558C16.3546 18.1318 16.8818 17.6046 17.1058 16.9327L17.5 15.75L17.8942 16.9327C18.1182 17.6046 18.6454 18.1318 19.3173 18.3558L20.5 18.75L19.3173 19.1442C18.6454 19.3682 18.1182 19.8954 17.8942 20.5673Z"
                  stroke="#3B82F6"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </g>
              <defs>
                <filter
                  id="filter0_d_2149_1841"
                  x="-1"
                  y="-1"
                  width="28"
                  height="28"
                  filterUnits="userSpaceOnUse"
                  color-interpolation-filters="sRGB"
                >
                  <feFlood flood-opacity="0" result="BackgroundImageFix" />
                  <feColorMatrix
                    in="SourceAlpha"
                    type="matrix"
                    values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                    result="hardAlpha"
                  />
                  <feOffset dy="1" />
                  <feGaussianBlur stdDeviation="1" />
                  <feColorMatrix
                    type="matrix"
                    values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.05 0"
                  />
                  <feBlend
                    mode="normal"
                    in2="BackgroundImageFix"
                    result="effect1_dropShadow_2149_1841"
                  />
                  <feBlend
                    mode="normal"
                    in="SourceGraphic"
                    in2="effect1_dropShadow_2149_1841"
                    result="shape"
                  />
                </filter>
              </defs>
            </svg>
            <p class="ml-3 mb-0">Smoother experience</p>
          </div>
          <div class="d-flex align-center py-2">
            <v-icon>mdi-heart-outline primary--text</v-icon>
            <p class="ml-3 mb-0">More collaborative features</p>
          </div>
          <div class="d-flex align-center py-2">
            <v-icon>mdi-rocket-outline primary--text</v-icon>
            <p class="ml-3 mb-0">Faster loading time</p>
          </div>
          <h2 class="mt-4 mt-sm-6">How?</h2>
          <div class="d-flex align-center pt-2 py-sm-2">
            <svg
              width="24"
              height="25"
              viewBox="0 0 24 25"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g filter="url(#filter0_d_2149_1853)">
                <path
                  d="M17.9815 18.7248C16.6121 16.9175 14.4424 15.75 12 15.75C9.55761 15.75 7.38789 16.9175 6.01846 18.7248M17.9815 18.7248C19.8335 17.0763 21 14.6744 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 14.6744 4.1665 17.0763 6.01846 18.7248M17.9815 18.7248C16.3915 20.1401 14.2962 21 12 21C9.70383 21 7.60851 20.1401 6.01846 18.7248M15 9.75C15 11.4069 13.6569 12.75 12 12.75C10.3431 12.75 9 11.4069 9 9.75C9 8.09315 10.3431 6.75 12 6.75C13.6569 6.75 15 8.09315 15 9.75Z"
                  stroke="#3B82F6"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </g>
              <defs>
                <filter
                  id="filter0_d_2149_1853"
                  x="-2"
                  y="-1"
                  width="28"
                  height="28"
                  filterUnits="userSpaceOnUse"
                  color-interpolation-filters="sRGB"
                >
                  <feFlood flood-opacity="0" result="BackgroundImageFix" />
                  <feColorMatrix
                    in="SourceAlpha"
                    type="matrix"
                    values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                    result="hardAlpha"
                  />
                  <feOffset dy="1" />
                  <feGaussianBlur stdDeviation="1" />
                  <feColorMatrix
                    type="matrix"
                    values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.05 0"
                  />
                  <feBlend
                    mode="normal"
                    in2="BackgroundImageFix"
                    result="effect1_dropShadow_2149_1853"
                  />
                  <feBlend
                    mode="normal"
                    in="SourceGraphic"
                    in2="effect1_dropShadow_2149_1853"
                    result="shape"
                  />
                </filter>
              </defs>
            </svg>
            <p class="ml-3 mb-0">Same user account, same data. Just log in.</p>
          </div>
        </v-col>
      </v-row>
      <v-card-actions class="px-4">
        <v-row no-gutters>
          <v-col cols="12" sm="6" class="pa-2">
            <v-btn block text @click="dialog = false">I'll check it out later</v-btn>
          </v-col>
          <v-col cols="12" sm="6" class="pa-2">
            <v-btn block color="primary" class="align-self-center">
              Go to the new Speckle
              <v-icon right>mdi-arrow-right</v-icon>
            </v-btn>
          </v-col>
        </v-row>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
export default {
  props: {
    showDialog: {
      type: Boolean,
      required: true
    }
  },
  methods: {
    closeDialog() {
      this.$emit('update:showDialog', false)
    }
  }
}
</script>
<style scoped lang="scss">
.v-application {
  .whats-new-dialog {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial,
      sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol' !important;
    .headline {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica,
        Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol' !important;
    }
    .v-btn {
      text-transform: unset !important;
      letter-spacing: unset !important;
    }
  }
}
</style>
