<template>
  <div class="bg-foundation-page p-4 text-foreground flex flex-col space-y-4">
    <div class="font-semibold">Text Styles Demo</div>

    <div class="flex space-x-4">
      <!-- Headings -->
      <div class="flex flex-col space-y-4 text-body-xs bg-foundation p-4">
        <span class="text-foreground-2">All of these have font-weight: 500</span>
        <div class="rounded flex flex-col">
          <span class="text-heading-2xl">text-heading-2xl</span>
          <span class="italic">
            Inter Medium, 30px, line height 40px, letter spacing -2.1% (-0.63px)
          </span>
        </div>
        <div class="rounded flex flex-col">
          <span class="text-heading-xl">text-heading-xl</span>
          <span class="italic">
            Inter Medium, 24px, line height 32px, letter spacing -1.9% (-0.456px)
          </span>
        </div>
        <div class="rounded flex flex-col">
          <span class="text-heading-lg">text-heading-lg</span>
          <span class="italic">
            Inter Medium, 18px, line height 24px, letter spacing -1.4% (-0.252px)
          </span>
        </div>
        <div class="rounded flex flex-col">
          <span class="text-heading">text-heading</span>
          <span class="italic">
            Inter Medium, 16px, line height 24px, letter spacing -1.1% (-0.176px)
          </span>
        </div>
        <div class="rounded flex flex-col">
          <span class="text-heading-sm">text-heading-sm</span>
          <span class="italic">
            Inter Medium, 14px, line height 24px, letter spacing -0.6% (-0.084px)
          </span>
        </div>
      </div>

      <!-- Body text styles -->
      <div class="flex flex-col space-y-4 text-body-xs bg-foundation p-4">
        <span class="text-foreground-2">All of these have font-weight: 400</span>
        <div class="rounded flex flex-col">
          <span class="text-body">text-body</span>
          <span class="italic">
            Inter, 16 px, line height 130%, letter spacing -0.176px
          </span>
        </div>
        <div class="rounded flex flex-col">
          <span class="text-body-sm">text-body-sm</span>
          <span class="italic">
            Inter, 14 px, line height 24 px, letter spacing -0.084px
          </span>
        </div>
        <div class="rounded flex flex-col">
          <span class="text-body-xs">text-body-xs</span>
          <span class="italic">
            Inter, 13 px, line height 24 px, letter spacing -0.032px
          </span>
        </div>
        <div class="rounded flex flex-col">
          <span class="text-body-2xs">text-body-2xs</span>
          <span class="italic">Inter, 12 px, line height 16 px, letter spacing 0</span>
        </div>
        <div class="rounded flex flex-col">
          <span class="text-body-3xs">text-body-3xs</span>
          <span class="italic">
            Inter, 11 px, line height 16 px, letter spacing 0.055px
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts"></script>
