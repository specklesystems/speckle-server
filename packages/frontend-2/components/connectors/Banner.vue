<template>
  <div
    class="relative rounded-[6px] overflow-hidden aspect-[896/405] max-h-[405px] w-full"
  >
    <figure class="dark:hidden absolute w-full">
      <NuxtImg
        src="/images/connectors/connectors_light.png"
        alt="Speckle Connectors"
        class="w-full h-auto aspect-[896/405] object-cover"
      />
      <NuxtImg
        src="/images/connectors/connectors_light.png"
        alt="Sync data in real time"
        class="absolute bottom-0 left-0 w-full h-[125px] aspect-[896/405] object-cover object-left-bottom blur-[20px]"
      />
    </figure>
    <figure class="hidden dark:block absolute w-full">
      <NuxtImg
        src="/images/connectors/connectors_dark.png"
        alt="Speckle Connectors"
        class="w-full h-auto aspect-[896/405] object-cover"
      />
      <NuxtImg
        src="/images/connectors/connectors_dark.png"
        alt="Speckle Connectors"
        class="absolute bottom-0 left-0 w-full h-[125px] aspect-[896/405] object-cover object-left-bottom blur-[20px]"
      />
    </figure>

    <div class="absolute bottom-0 w-full p-6">
      <h3>Sync models in real time</h3>
      <p class="text-body-xs text-foreground-2 mt-2 max-w-md text-balance">
        Extract and exchange data between the most popular AEC applications using our
        tailored connectors.
      </p>
    </div>
  </div>
</template>
