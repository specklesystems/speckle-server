<template>
  <div class="bg-primary">
    <div class="layout-container pt-14">
      <div class="grid gap-8 grid-cols-12">
        <div
          class="col-start-3 col-span-8 flex flex-col text-center text-foreground-on-primary"
        >
          <h1 class="h1 font-semibold leading-10 mb-5">Manager for Speckle</h1>
          <h2 class="h6 font-normal leading-6 mb-8">
            Manage your Connectors and Accounts with ease! Manager for Speckle is the
            only tool you'll need to install and update Connectors and link your
            Accounts.
          </h2>
          <div class="w-full aspect-video bg-foreground rounded-2xl mb-8">
            <!-- Video goes here -->
          </div>
          <div class="flex">
            <!-- Steps go here -->
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
definePageMeta({
  layout: 'landing'
})
</script>
