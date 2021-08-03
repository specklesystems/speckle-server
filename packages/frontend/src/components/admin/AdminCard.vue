<template>
  <v-card rounded="lg" class="pa-4 mb-4" elevation="0" v-bind="$attrs">
    <template slot="progress">
      <v-progress-linear indeterminate></v-progress-linear>
    </template>
    <v-card-title>
      <v-icon class="mr-2">{{ icon }}</v-icon>
      {{ title }}

      <v-spacer />
      <span>
        <slot name="menu"></slot>
      </span>
    </v-card-title>

    <v-card-subtitle>
      <span>
        <slot name="subtitle"></slot>
      </span>
    </v-card-subtitle>
    <v-card-text>
      <slot></slot>
    </v-card-text>
  </v-card>
</template>

<script>
export default {
  name: 'AdminCard',
  props: ['title', 'icon']
}
</script>

<style scoped lang="scss"></style>
