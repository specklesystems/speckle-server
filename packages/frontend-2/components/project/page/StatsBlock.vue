<template>
  <div class="bg-foundation rounded-lg p-4 sm:px-6">
    <div class="flex flex-col">
      <div class="text-foreground-2 mb-2">
        <slot name="top" />
      </div>
      <div class="text-foreground">
        <slot name="bottom" />
      </div>
    </div>
    <slot />
  </div>
</template>
