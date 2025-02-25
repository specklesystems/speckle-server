<template>
  <div class="mb-20">
    <div class="relative z-10 mt-20 mb-20 space-y-2 max-w-prose">
      <h1 class="text-5xl mt-12 tracking-tight">
        The collaborative
        <span class="text-primary font-bold">data hub</span>
        that connects with your AEC tools
      </h1>
      <h2 class="text-heading-lg mt-12 text-foreground-2">
        Teams around the world use Speckle for instant business intelligence, design
        coordination and automation.
      </h2>
      <FormButton>Start building</FormButton>
    </div>
    <div
      class="relative -mt-20 z-0 w-screen left-[50%] right-[50%] -ml-[50vw] -mr-[50vw] py-10 justify-center flex"
    >
      <div class="max-w-screen-lg">
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

    <div class="grid grid-cols-2 mb-20">
      <div class="flex items-center h-32">
        <h3 class="text-4xl font-bold tracking-tight">
          Your data infrastructure deserves better
        </h3>
      </div>
      <div class="flex items-center h-32">
        <div class="text-body text-right text-foreground-2">
          Unify your tech stack & gain data-driven insights for decision making and Set
          the maximum width of an element using the max-w-* utilities.
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 perspective-400">
      <LayoutPanel fancy-glow>
        <template #header>
          <h4 class="text-heading-lg line-clamp-2">
            Drive business insights for every project
          </h4>
        </template>
        <div class="text-body-xs">
          Collaborate with ease while tracking changes in real-time.
        </div>
      </LayoutPanel>
      <LayoutPanel fancy-glow>
        <template #header>
          <h4 class="text-heading-lg line-clamp-2">
            Delightful design coordination that takes seconds
          </h4>
        </template>
        <div class="text-body-xs">
          Collaborate with ease while tracking changes in real-time.
        </div>
      </LayoutPanel>
      <LayoutPanel fancy-glow>
        <template #header>
          <h4 class="text-heading-lg line-clamp-2">
            Generate deliverables on every model change
          </h4>
        </template>
        <div class="text-body-xs">
          Collaborate with ease while tracking changes in real-time.
        </div>
      </LayoutPanel>
    </div>
    <div class="py-10 mt-20 rounded-lg">
      <div class="mx-auto">
        <h2 class="text-base/7 font-semibold text-primary">Deploy faster</h2>
        <p
          class="mt-2 max-w-lg text-pretty text-4xl font-semibold tracking-tight sm:text-5xl"
        >
          Everything you need to deploy your app
        </p>
        <div
          class="mt-10 grid grid-cols-1 gap-4 sm:mt-16 lg:grid-cols-6 lg:grid-rows-2"
        >
          <div class="relative lg:col-span-3">
            <div
              class="absolute inset-px rounded-lg bg-foundation max-lg:rounded-t-[2rem] lg:rounded-tl-[2rem]"
            />
            <div
              class="relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)] max-lg:rounded-t-[calc(2rem+1px)] lg:rounded-tl-[calc(2rem+1px)]"
            >
              <img
                class="h-80 object-cover object-left"
                src="https://tailwindui.com/plus-assets/img/component-images/bento-01-performance.png"
                alt=""
              />
              <div class="p-10 pt-4">
                <h3 class="text-sm/4 font-semibold text-primary">Performance</h3>
                <p class="mt-2 text-lg font-medium tracking-tight">
                  Lightning-fast builds
                </p>
                <p class="mt-2 max-w-lg text-sm/6 text-gray-600">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. In gravida
                  justo et nulla efficitur, maximus egestas sem pellentesque.
                </p>
              </div>
            </div>
            <div
              class="pointer-events-none absolute inset-px rounded-lg shadow ring-1 ring-black/5 max-lg:rounded-t-[2rem] lg:rounded-tl-[2rem]"
            />
          </div>
          <div class="relative lg:col-span-3">
            <div
              class="absolute inset-px rounded-lg bg-foundation lg:rounded-tr-[2rem]"
            />
            <div
              class="relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)] lg:rounded-tr-[calc(2rem+1px)]"
            >
              <img
                class="h-80 object-cover object-left lg:object-right"
                src="https://tailwindui.com/plus-assets/img/component-images/bento-01-releases.png"
                alt=""
              />
              <div class="p-10 pt-4">
                <h3 class="text-sm/4 font-semibold text-primary">Releases</h3>
                <p class="mt-2 text-lg font-medium tracking-tight">Push to deploy</p>
                <p class="mt-2 max-w-lg text-sm/6 text-gray-600">
                  Curabitur auctor, ex quis auctor venenatis, eros arcu rhoncus massa,
                  laoreet dapibus ex elit vitae odio.
                </p>
              </div>
            </div>
            <div
              class="pointer-events-none absolute inset-px rounded-lg shadow ring-1 ring-black/5 lg:rounded-tr-[2rem]"
            />
          </div>
          <div class="relative lg:col-span-2">
            <div
              class="absolute inset-px rounded-lg bg-foundation lg:rounded-bl-[2rem]"
            />
            <div
              class="relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)] lg:rounded-bl-[calc(2rem+1px)]"
            >
              <img
                class="h-80 object-cover object-left"
                src="https://tailwindui.com/plus-assets/img/component-images/bento-01-speed.png"
                alt=""
              />
              <div class="p-10 pt-4">
                <h3 class="text-sm/4 font-semibold text-primary">Speed</h3>
                <p class="mt-2 text-lg font-medium tracking-tight">
                  Built for power users
                </p>
                <p class="mt-2 max-w-lg text-sm/6 text-gray-600">
                  Sed congue eros non finibus molestie. Vestibulum euismod augue.
                </p>
              </div>
            </div>
            <div
              class="pointer-events-none absolute inset-px rounded-lg shadow ring-1 ring-black/5 lg:rounded-bl-[2rem]"
            />
          </div>
          <div class="relative lg:col-span-2">
            <div class="absolute inset-px rounded-lg bg-foundation" />
            <div
              class="relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)]"
            >
              <img
                class="h-80 object-cover"
                src="https://tailwindui.com/plus-assets/img/component-images/bento-01-integrations.png"
                alt=""
              />
              <div class="p-10 pt-4">
                <h3 class="text-sm/4 font-semibold text-primary">Integrations</h3>
                <p class="mt-2 text-lg font-medium tracking-tight">
                  Connect your favorite tools
                </p>
                <p class="mt-2 max-w-lg text-sm/6 text-gray-600">
                  Maecenas at augue sed elit dictum vulputate, in nisi aliquam maximus
                  arcu.
                </p>
              </div>
            </div>
            <div
              class="pointer-events-none absolute inset-px rounded-lg shadow ring-1 ring-black/5"
            />
          </div>
          <div class="relative lg:col-span-2">
            <div
              class="absolute inset-px rounded-lg bg-foundation max-lg:rounded-b-[2rem] lg:rounded-br-[2rem]"
            />
            <div
              class="relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)] max-lg:rounded-b-[calc(2rem+1px)] lg:rounded-br-[calc(2rem+1px)]"
            >
              <img
                class="h-80 object-cover"
                src="https://tailwindui.com/plus-assets/img/component-images/bento-01-network.png"
                alt=""
              />
              <div class="p-10 pt-4">
                <h3 class="text-sm/4 font-semibold text-primary">Network</h3>
                <p class="mt-2 text-lg font-medium tracking-tight">
                  Globally distributed CDN
                </p>
                <p class="mt-2 max-w-lg text-sm/6 text-gray-600">
                  Aenean vulputate justo commodo auctor vehicula in malesuada semper.
                </p>
              </div>
            </div>
            <div
              class="pointer-events-none absolute inset-px rounded-lg shadow ring-1 ring-black/5 max-lg:rounded-b-[2rem] lg:rounded-br-[2rem]"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts"></script>
