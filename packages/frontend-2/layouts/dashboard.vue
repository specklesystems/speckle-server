<template>
  <div>
    <HeaderNavBar hide-user-nav />
    <div class="h-dvh w-dvh overflow-hidden flex flex-col">
      <!-- Static Spacer to allow for absolutely positioned HeaderNavBar  -->
      <div class="h-12 w-full shrink-0"></div>

      <div class="relative flex h-[calc(100dvh-3rem)]">
        <DashboardSidebar />

        <main class="relative w-full h-full overflow-y-hidden">
          <div class="absolute w-full h-full z-10">
            <!-- Fancy background here -->
          </div>
          <div
            class="absolute w-full h-full z-20 overflow-y-auto simple-scrollbar pt-4 lg:pt-6 pb-16"
          >
            <div class="container w-full px-6 md:px-8">
              <slot />
            </div>
          </div>
        </main>
      </div>
    </div>
  </div>
</template>
