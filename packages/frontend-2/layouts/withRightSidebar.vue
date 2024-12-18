<template>
  <div>
    <HeaderNavBar />
    <div class="h-dvh w-dvh overflow-hidden flex flex-col">
      <!-- Static Spacer to allow for absolutely positioned HeaderNavBar  -->
      <div class="h-12 w-full shrink-0"></div>

      <div class="relative flex h-[calc(100dvh-3rem)]">
        <DashboardSidebar />

        <main class="w-full h-full overflow-y-auto simple-scrollbar pt-4 lg:pt-6 pb-16">
          <div class="container mx-auto px-6 md:px-8">
            <slot />
          </div>
        </main>

        <div
          class="static h-full flex w-[17rem] shrink-0 border-l border-outline-3 bg-foundation-page"
        >
          <PortalTarget name="right-sidebar">
            <div class="h-full w-full flex items-center justify-center">
              <CommonLoadingIcon />
            </div>
          </PortalTarget>
        </div>
      </div>
    </div>
  </div>
</template>
