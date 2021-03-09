<template>
  <v-card flat background="transparent" class="pb-7 px-7">
    <v-card-text class="headline">{{ message }} Here's how to get started:</v-card-text>
    <v-card-actions>
      <v-row justify-space-between>
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
              href="https://speckle.guide/user/connectors.html"
              tile
              target="_blank"
              :class="`pt-4  ${hover ? 'elevation-5' : 'elevation-0'} rounded-lg`"
              style="transition: all 0.15s; min-height: 130px"
            >
              <v-card-title class="">🔌 Connectors</v-card-title>
              <v-card-text>
                Install connectors for some of the most popular AEC software and start sending and
                receivng data right away!
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
                Join our community to get answers to your questoins and provide feedback!
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
    message: {
      type: String,
      default: "It's a bit quiet here."
    },
    name: {
      type: String,
      default: null
    },
    resourceType: {
      type: String,
      default: null
    }
  },
  computed: {},
  methods: {}
}
</script>
