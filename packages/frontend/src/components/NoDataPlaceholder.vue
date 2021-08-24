<template>
  <v-container>
    <v-row justify="center" style="margin-top: 50px" dense>
      <v-col cols="12" lg="6" md="6" xl="6" class="d-flex flex-column justify-center align-center">
        <v-card flat tile color="transparent" class="pa-0">
          <div class="d-flex flex-column justify-space-between align-center mb-10">
            <v-img contain max-height="200" src="@/assets/emptybox.png"></v-img>
          </div>
          <div class="pl-4 text-center mb-2 space-grotesk">
            <slot name="default"></slot>
          </div>
          <slot name="actions">
            <v-list rounded class="transparent">
              <v-list-item link class="primary mb-4" dark>
                <v-list-item-icon>
                  <v-icon>mdi-swap-horizontal</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                  <v-list-item-title>Connectors</v-list-item-title>
                  <v-list-item-subtitle class="caption">
                    Learn how to send data from various software.
                  </v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>

              <v-list-item link :class="`grey ${ $vuetify.theme.dark ? 'darken-4' : 'lighten-4'} mb-4`">
                <v-list-item-icon>
                  <v-icon>mdi-school</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                  <v-list-item-title>Tutorials</v-list-item-title>
                  <v-list-item-subtitle class="caption">
                    Tips, tricks and how-to guides.
                  </v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>

              <v-list-item link :class="`grey ${ $vuetify.theme.dark ? 'darken-4' : 'lighten-4'} mb-4`">
                <v-list-item-icon>
                  <v-icon>mdi-book-open-variant</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                  <v-list-item-title>Docs</v-list-item-title>
                  <v-list-item-subtitle class="caption">
                    Documentation and training material for all connectors.
                  </v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>

              <v-list-item link :class="`grey ${ $vuetify.theme.dark ? 'darken-4' : 'lighten-4'} mb-4`">
                <v-list-item-icon>
                  <v-icon>mdi-forum</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                  <v-list-item-title>Community</v-list-item-title>
                  <v-list-item-subtitle class="caption">
                    Our community is friendly and here to help!
                  </v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
            </v-list>
          </slot>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
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
      default: "🍃 It's a bit quiet here..."
    }
  },
  computed: {},
  methods: {}
}
</script>
