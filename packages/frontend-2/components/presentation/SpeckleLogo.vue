<template>
  <PresentationFloatingPanel
    class="flex items-center shrink-0 select-none px-[3px] h-10"
  >
    <NuxtLink
      to="https://speckle.systems/"
      external
      target="_blank"
      class="flex items-center gap-1 hover:bg-highlight-1 rounded-md h-8 px-2.5"
    >
      <span class="text-body-xs text-foreground-2">Made with</span>
      <img
        class="size-6 block mr-[0.5px] ml-0.5"
        src="~~/assets/images/speckle_logo_big.png"
        alt="Speckle"
      />

      <div class="text-body-xs mt-0 font-medium">Speckle</div>
    </NuxtLink>
  </PresentationFloatingPanel>
</template>
