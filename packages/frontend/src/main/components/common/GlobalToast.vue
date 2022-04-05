<template>
  <v-snackbar v-model="snack" app bottom color="primary">
    {{ text }}
    <template #action="{}">
      <v-btn v-if="actionName" :to="to" @click="snack = false">
        {{ actionName }}
      </v-btn>
      <v-btn small icon @click="snack = false">
        <v-icon small>mdi-close</v-icon>
      </v-btn>
    </template>
  </v-snackbar>
</template>
<script>
export default {
  data() {
    return {
      snack: false,
      text: null,
      actionName: null,
      to: null
    }
  },
  watch: {
    snack(newVal) {
      if (!newVal) {
        this.text = null
        this.actionName = null
        this.to = null
      }
    }
  },
  mounted() {
    this.$eventHub.$on('notification', (args) => {
      this.snack = true
      this.text = args.text
      this.actionName = args.action ? args.action.name : null
      this.to = args.action ? args.action.to : null
    })
  }
}
</script>
