<template>
  <div>
    <v-avatar :size="size">
      <v-img v-if="avatar" :src="avatar" />
      <v-img v-else :src="`https://robohash.org/${seed}.png?size=${size}x${size}`" />
    </v-avatar>
  </div>
</template>

<script>
export default {
  props: {
    size: {
      type: String,
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
  }
}
</script>
