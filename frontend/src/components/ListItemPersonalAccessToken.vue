<template>
  <v-list-item>
    <v-list-item-content>
      <v-list-item-title>
        <v-chip small outlined class="mr-2">{{ token.lastChars }}</v-chip>
        <b>{{ token.name }}</b>
      </v-list-item-title>
      <v-list-item-subtitle>
        Created:
        {{ token.createdAt | dateParse() | dateFormat("DD MMM YY") }} (
        <timeago :datetime="token.createdAt"></timeago>
        ) Last Used:
        {{ token.lastUsed | dateParse() | dateFormat("DD MMM YY") }} (
        <timeago :datetime="token.lastUsed"></timeago>
        )
      </v-list-item-subtitle>
    </v-list-item-content>
    <v-list-item-action>
      <v-btn small icon>
        <v-icon color="error">mdi-delete</v-icon>
      </v-btn>
    </v-list-item-action>
  </v-list-item>
</template>
<script>
export default {
  components: {},
  props: {
    token: {
      type: Object,
      default: () => {}
    }
  },
  methods: {
    revokeToken() {
      // TODO
    }
  }
}
</script>
