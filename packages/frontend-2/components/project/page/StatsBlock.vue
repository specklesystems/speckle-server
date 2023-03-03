<template>
  <div class="bg-foundation rounded-lg py-4 px-6">
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
