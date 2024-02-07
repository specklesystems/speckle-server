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
          <h4 class="mt-0">Legacy Site</h4>
          <p class="text-body-2 mb-0 mt-1 primary--text text--disabled">
            This is the legacy Speckle site and will be replaced soon.
          </p>
        </v-col>

        <v-col cols="6" class="d-flex justify-end">
          <!--TODO - Update Link-->
          <v-btn block class="align-self-center outlined">
            Go to the new site
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
