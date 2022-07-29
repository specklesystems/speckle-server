<template>
  <v-avatar :size="size" color="grey lighten-3">
    <v-img v-if="hasValidAvatar" :src="avatar" />
    <v-img v-else :src="`https://robohash.org/${seed}.png?size=${size}x${size}`" />
  </v-avatar>
</template>

<script>
export default {
  props: {
    size: {
      type: Number,
      required: true
    },
    seed: {
      type: String,
      required: true
    },
    avatar: {
      type: String,
      default: null
    }
  },
  computed: {
    hasValidAvatar() {
      if (!this.avatar) return false

      const validPrefixes = ['http', 'data:']
      for (const validPrefix of validPrefixes) {
        if (this.avatar.startsWith(validPrefix)) return true
      }

      return false
    }
  }
}
</script>
