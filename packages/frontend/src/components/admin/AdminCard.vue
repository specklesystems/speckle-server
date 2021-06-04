<template>
  <v-card elevation="0" outlined rounded>
    <v-card-title class="d-flex justify-space-between">
      <span>{{title}}</span>
      <span>
        <slot name="menu"></slot>
      </span>
    </v-card-title>
    <span><slot></slot></span>
  </v-card>
</template>

<script>
export default {
  name: "AdminCard",
  props: ["title"]
};
</script>

<style scoped>

</style>
