<template>
  <div>
    <HeaderNavBar />
    <div class="h-dvh w-dvh overflow-hidden flex flex-col">
      <!-- Static Spacer to allow for absolutely positioned HeaderNavBar  -->
      <div class="h-12 w-full shrink-0"></div>

      <div class="relative flex h-[calc(100dvh-3rem)]">
        <DashboardSidebar />

        <main class="w-full h-full overflow-y-auto simple-scrollbar pt-8 pb-16">
          <div class="container mx-auto px-6 md:px-8">
            <slot />
          </div>
        </main>

        <!-- Right Sidebar Portal Target -->
        <PortalTarget name="right-sidebar"></PortalTarget>
      </div>
    </div>
  </div>
</template>
