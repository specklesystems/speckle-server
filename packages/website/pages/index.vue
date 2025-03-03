<template>
  <div class="mb-20">
    <div class="relative z-10 mt-20 mb-20 space-y-2 max-w-prose mx-auto text-center">
      <h1 class="text-5xl mt-12 tracking-tight">
        The collaborative
        <span class="text-primary font-bold">data hub</span>
        that connects with your AEC tools
      </h1>
      <h2 class="text-heading-lg mt-12 text-foreground-2">
        Teams around the world use Speckle for instant business intelligence, design
        coordination and automation.
      </h2>
      <FormButton size="lg">Start building</FormButton>
    </div>
    <div
      class="relative -mt-20 z-0 w-screen left-[50%] right-[50%] -ml-[50vw] -mr-[50vw] py-10 justify-center flex"
    >
      <div class="max-w-screen-lg rotate-x-50 rotate-z-45">
        <div
          class="dark:hidden flex rounded-xl overflow-hidden shadow-md border-2 border-outline-2 bg-red-200"
        >
          <img
            src="~~/assets/images/product-light.png"
            alt="Speckle"
            class="object-contain"
          />
        </div>
        <div
          class="dark:flex hidden rounded-xl overflow-hidden shadow-md border-2 border-outline-2 w-full"
        >
          <img
            src="~~/assets/images/product-dark.png"
            alt="Speckle"
            class="object-contain"
          />
        </div>
      </div>
    </div>

    <section class="relative py-16">
      <h2 class="text-center text-heading-lg mb-2 text-foreground-2">
        Powering the world's best AEC companies.
      </h2>
      <div
        class="logos group relative overflow-hidden whitespace-nowrap py-10 [mask-image:_linear-gradient(to_right,_transparent_0,_white_128px,white_calc(100%-128px),_transparent_100%)]"
      >
        <div
          class="animate-slide-left-infinite group-hover:animation-pause inline-block w-max"
        >
          <img
            class="mx-4 inline h-10"
            src="https://img.logoipsum.com/218.svg"
            alt="Transistor"
          />
          <img
            class="mx-4 inline h-10"
            src="https://img.logoipsum.com/218.svg"
            alt="Reform"
          />
          <img
            class="mx-4 inline h-10"
            src="https://img.logoipsum.com/211.svg"
            alt="Tuple"
          />
          <img
            class="mx-4 inline h-10"
            src="https://img.logoipsum.com/214.svg"
            alt="SavvyCal"
          />
          <img
            class="mx-4 inline h-10"
            src="https://img.logoipsum.com/234.svg"
            alt="SavvyCal"
          />
          <img
            class="mx-4 inline h-10"
            src="https://img.logoipsum.com/211.svg"
            alt="SavvyCal"
          />
        </div>

        <!-- Duplicate of the above for infinite effect (you can use javascript to duplicate this too) -->
        <div
          class="animate-slide-left-infinite group-hover:animation-pause inline-block w-max"
        >
          <img
            class="mx-4 inline h-10"
            src="https://img.logoipsum.com/218.svg"
            alt="Transistor"
          />
          <img
            class="mx-4 inline h-10"
            src="https://img.logoipsum.com/218.svg"
            alt="Reform"
          />
          <img
            class="mx-4 inline h-10"
            src="https://img.logoipsum.com/211.svg"
            alt="Tuple"
          />
          <img
            class="mx-4 inline h-10"
            src="https://img.logoipsum.com/214.svg"
            alt="SavvyCal"
          />
          <img
            class="mx-4 inline h-10"
            src="https://img.logoipsum.com/234.svg"
            alt="SavvyCal"
          />
          <img
            class="mx-4 inline h-10"
            src="https://img.logoipsum.com/211.svg"
            alt="SavvyCal"
          />
        </div>
      </div>
    </section>

    <section class="my-10">
      <HomepageWorkflows />
    </section>

    <HomepageConnectorsSlideshow />
  </div>
</template>
<script setup lang="ts">
const query = groq`*[_type == "workflow"]{_id, title, slug, content, useCase->{title, _id}, source -> {name, "imageUrl": image.asset->url}, receiver -> {name, "imageUrl": image.asset->url}}`

const { data: workflows } = useSanityQuery(query)
</script>
