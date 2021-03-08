<template>
  <v-card flat background="transparent" class="pb-7 px-7">
    <v-card-text class="headline">
      <i>
        It's a bit lonely here,
        <b>{{ name }}</b>
        has no data yet.
        <br />
        Check out the resources below 👇
      </i>
    </v-card-text>
    <v-card-actions>
      <v-row justify-space-between>
        <v-col sm="4" xs="12" class="pa-2">
          <v-hover>
            <v-card
              slot-scope="{ hover }"
              height="100%"
              href="https://speckle.guide/"
              target="_blank"
              tile
              :class="`pt-4 elevation-3 ${hover ? 'primary' : ''}`"
              style="transition: all 0.15s; min-height: 130px"
            >
              <v-card-title class="display-1 font-weight-light">📚 Docs</v-card-title>
              <v-card-text>
                Visit our user guide, it contains documentation and training material for users and
                developers alike.
              </v-card-text>
            </v-card>
          </v-hover>
        </v-col>
        <v-col sm="4" xs="12" class="pa-2">
          <v-hover>
            <v-card
              slot-scope="{ hover }"
              height="100%"
              href="https://speckle.guide/user/connectors.html"
              tile
              target="_blank"
              :class="`pt-4 elevation-3 ${hover ? 'primary' : ''}`"
              style="transition: all 0.15s; min-height: 130px"
            >
              <v-card-title class="display-1 font-weight-light">🔌 Connectors</v-card-title>
              <v-card-text>
                Install connectors for some of the most popular AEC software and start sending and
                receivng data right away!
              </v-card-text>
            </v-card>
          </v-hover>
        </v-col>
        <v-col sm="4" xs="12" class="pa-2">
          <v-hover>
            <v-card
              slot-scope="{ hover }"
              height="100%"
              href="http://speckle.community"
              tile
              target="_blank"
              :class="`pt-4 elevation-3 ${hover ? 'primary' : ''}`"
              style="transition: all 0.15s; min-height: 130px"
            >
              <v-card-title class="display-1 font-weight-light">👪 Community</v-card-title>
              <v-card-text>
                Join our community to get answers to your questoins and provide feedback!
              </v-card-text>
            </v-card>
          </v-hover>
        </v-col>
      </v-row>
      <!-- <v-btn color="primary">
        <v-icon left>📚</v-icon>
        Check out the docs!
      </v-btn>
      <v-btn color="primary">
        <v-icon left>📚</v-icon>
        Download Speckle Manager
      </v-btn>
      <v-btn color="primary">
        <v-icon left>📚</v-icon>
        Browse the community forum
      </v-btn> -->
    </v-card-actions>
  </v-card>
</template>
<script>
export default {
  props: ['name'],
  computed: {},
  methods: {}
}
</script>
