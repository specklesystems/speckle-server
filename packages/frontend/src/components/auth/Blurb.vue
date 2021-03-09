<template>
  <v-card class="elevation-0 transparent pa-5 pb-0">
    <v-card-text class="text-h3 text-sm-h4 text-md-h3 primary--text">
      <span class="primary--text"><b>Speckle</b></span>
      <span class="font-weight-light">, empowering your design and construction data.</span>
    </v-card-text>
    <div class="">
      <v-card-text class="text-h6 font-weight-regular">
        Speckle helps leading AEC companies freely exchange data between software silos and automate
        design and delivery processes:
        <span class="primary--text text--disabled">
          join 100s of designers, architects, engineers and developers building the digital future
          of AEC.
        </span>
      </v-card-text>
    </div>
    <v-card-text v-if="serverInfo">{{ serverInfo.name }} @ {{ serverInfo.company }}</v-card-text>
  </v-card>
</template>
<script>
export default {
  name: 'Blurb',
  props: ['serverInfo']
}
</script>
