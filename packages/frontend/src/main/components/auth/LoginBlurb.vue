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
    <div>
      <v-card-text class="text-h6 font-weight-regular">
        Speckle helps leading AEC companies freely exchange data between software silos
        and automate design and delivery processes:
        <span class="primary--text text--disabled">
          join 100s of designers, architects, engineers and developers building the
          digital future of AEC.
        </span>
      </v-card-text>
    </div>
    <div class="px-4">
      <v-divider></v-divider>
      <v-row align="center" justify="center" class="py-4">
        <v-col cols="6">
          <h3 class="text-h6 font-weight-bold mt-0">This is the Legacy Web App</h3>
          <p class="mb-0 mt-1 primary--text text--disabled mr-2">
            A better and more powerful web app is replacing this.
            <a
              href="https://speckle.systems/the-new-way-to-collaborate-in-aec/"
              target="_blank"
              class="primary--text text--disabled"
            >
              Learn more.
            </a>
          </p>
        </v-col>

        <v-col cols="6" class="d-flex justify-end">
          <v-btn
            href="https://app.speckle.systems/"
            outlined
            block
            class="align-self-center outlined ml-4"
          >
            Go to the new web app
            <v-icon right>mdi-rocket-launch</v-icon>
          </v-btn>
        </v-col>
      </v-row>
      <v-divider></v-divider>
    </div>
  </v-card>
</template>
<script>
export default {
  name: 'LoginBlurb'
}
</script>
