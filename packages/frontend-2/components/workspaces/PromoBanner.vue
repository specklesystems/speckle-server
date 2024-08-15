<template>
  <div
    class="relative w-full bg-foundation-page border border-outline-2 rounded-lg overflow-hidden p-12"
  >
    <div class="absolute inset-0">
      <img
        src="~~/assets/images/workspaces.png"
        alt="Introducing Workspaces"
        class="absolute top-0 right-0 w-7/12 h-full object-cover"
      />
      <div
        class="absolute top-0 right-0 h-full w-7/12 bg-gradient-to-r from-foundation-page"
      >
        <div class="h-full w-64 bg-gradient-to-r from-foundation-page" />
      </div>
    </div>

    <div class="relative z-10 text-foreground max-w-lg">
      <div class="flex gap-1 items-center">
        <h3 class="text-heading-lg">Introducing Workspaces</h3>
        <CommonBadge rounded class="">NEW</CommonBadge>
      </div>
      <p class="text-body-sm mt-4">
        Talented teams around the world use Workspaces for seamless project delivery.
        Control and easier collaboration with a shared space for your team and data.
      </p>
      <div class="flex mt-6 gap-2">
        <FormButton color="outline">Create workspace</FormButton>
        <FormButton color="subtle">Learn more</FormButton>
      </div>
    </div>
  </div>
</template>
