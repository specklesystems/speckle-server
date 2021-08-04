<template>
  <v-card flat class="transparent pb-7">
    <v-card-text v-if="showMessage" class="headline">
      {{ message }}
    </v-card-text>
    <v-card-actions>
      <v-row justify-space-between>
        <v-col cols="12" class="pa-2">
          <v-hover>
            <v-card
              slot-scope="{ hover }"
              height="100%"
              href="https://speckle.systems/tutorials/"
              tile
              target="_blank"
              :class="`pt-4  ${hover ? 'elevation-5' : 'elevation-0'} rounded-lg`"
              style="transition: all 0.15s; min-height: 130px"
            >
              <v-card-title class="">🏃‍♀️ Tutorials</v-card-title>
              <v-card-text>
                Get started as fast as humanly possible by following our Tutorials!
              </v-card-text>
            </v-card>
          </v-hover>
        </v-col>
        <v-col cols="12" class="pa-2">
          <v-hover>
            <v-card
              slot-scope="{ hover }"
              height="100%"
              href="https://speckle.guide/"
              target="_blank"
              tile
              :class="`pt-4  ${hover ? 'elevation-5' : 'elevation-0'} rounded-lg`"
              style="transition: all 0.15s; min-height: 130px"
            >
              <v-card-title class="">📚 Docs</v-card-title>
              <v-card-text>
                Visit our user guide, it contains documentation and training material for users and
                developers alike.
              </v-card-text>
            </v-card>
          </v-hover>
        </v-col>
        <v-col cols="12" class="pa-2">
          <v-hover>
            <v-card
              slot-scope="{ hover }"
              height="100%"
              href="http://speckle.community"
              tile
              target="_blank"
              :class="`pt-4  ${hover ? 'elevation-5' : 'elevation-0'} rounded-lg`"
              style="transition: all 0.15s; min-height: 130px"
            >
              <v-card-title class="">👪 Community</v-card-title>
              <v-card-text>
                Join our community to get answers to your questions and provide feedback!
              </v-card-text>
            </v-card>
          </v-hover>
        </v-col>
        <v-col cols="12" class="pa-2">
          <v-hover>
            <v-card
              slot-scope="{ hover }"
              height="100%"
              href="https://speckle.xyz/streams/3073b96e86"
              tile
              target="_blank"
              :class="`pt-4  ${hover ? 'elevation-5' : 'elevation-0'} rounded-lg`"
              style="transition: all 0.15s; min-height: 130px"
            >
              <v-card-title class="">🏗 Sample Stream</v-card-title>
              <v-card-text>
                Confused? Check out a sample stream of the famous Speckle Haus, designed by our one
                and only Claire!
              </v-card-text>
            </v-card>
          </v-hover>
        </v-col>
      </v-row>
    </v-card-actions>
  </v-card>
</template>
<script>
export default {
  props: {
    showMessage: {
      type: Boolean,
      default: true
    },
    message: {
      type: String,
      default: "It's a bit quiet here."
    }
  },
  computed: {},
  methods: {}
}
</script>
