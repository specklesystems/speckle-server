<template>
  <v-card class="rounded-lg" v-bind="$attrs">
    <v-card-title class="d-flex justify-space-between">
      <span>{{ title }}</span>
      <span>
        <slot name="menu"></slot>
      </span>
    </v-card-title>
    <v-card-text><slot></slot></v-card-text>
  </v-card>
</template>

<script>
export default {
  name: "AdminCard",
  props: ["title"]
};
</script>

<style scoped></style>
