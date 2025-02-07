<template>
  <nav class="fixed z-40 top-0 h-12 bg-foundation border-b border-outline-2">
    <div
      class="flex gap-8 items-center justify-between h-full w-screen py-4 px-3 sm:px-4"
    >
      <div>
        <slot name="header-left" />
      </div>
      <div>
        <slot name="header-right" />
      </div>
    </div>
  </nav>
</template>
