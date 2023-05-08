<template>
  <button
    :class="`bg-foundation text-foreground shadow-md rounded-lg w-10 flex flex-col justify-center space-y-1 py-1`"
  >
    <slot></slot>
  </button>
</template>
<script setup lang="ts"></script>
