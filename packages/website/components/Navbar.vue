<template>
  <div
    class="relative h-16 lg:px-0 sticky top-0 z-50 hover:shadow-sm bg-neutral-50/90 dark:bg-neutral-950/90 backdrop-blur-sm flex items-center border-b border-outline-2"
  >
    <div class="max-w-screen-lg mx-auto w-full">
      <!-- <div
      class="max-w-screen-lg rounded-lg bg-foundation mx-auto p-2 border-2 border-highlight-1 hover:border-highlight-3 transition-all w-full"
    > -->
      <div class="flex justify-between w-full items-center">
        <div class="flex space-x-2 items-center">
          <CommonLogoblock class="mr-4" />
          <HeaderMainNav />
        </div>
        <div class="flex space-x-2 h-full items-center">
          <CommonThemeToggle />
          <button
            class="transition px-3 py-1 text-heading-sm rounded-md hover:bg-highlight-2 text-foreground-3 hover:text-foreground"
          >
            Log in
          </button>
          <FormButton>Sign up</FormButton>
        </div>
      </div>
    </div>
  </div>
</template>
