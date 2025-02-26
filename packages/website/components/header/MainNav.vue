<template>
  <NavigationMenuRoot v-model="currentTrigger" class="relative flex justify-center">
    <NavigationMenuList class="center m-0 flex list-none">
      <NavigationMenuItem>
        <NavigationMenuTrigger>
          <CommonNavButton>Product</CommonNavButton>
        </NavigationMenuTrigger>
        <NavigationMenuContent
          class="data-[motion=from-start]:animate-enterFromLeft data-[motion=from-end]:animate-enterFromRight data-[motion=to-start]:animate-exitToLeft data-[motion=to-end]:animate-exitToRight flex justify-center"
        >
          <ul
            class="m-0 grid list-none gap-2 grid-cols-4 p-8 max-w-screen-lg bg-foundation-page rounded-md border border-1 border-outline-2 shadow-md"
          >
            <NavigationMenuListItem
              href="https://stitches.dev/"
              title="Business Intelligence"
            >
              CSS-in-JS with best-in-class developer experience.
            </NavigationMenuListItem>
            <NavigationMenuListItem href="/colors" title="Design Coordination">
              Beautiful, thought-out palettes with auto dark mode.
            </NavigationMenuListItem>
            <NavigationMenuListItem
              href="https://lucide.dev/icons/"
              title="Interactive Model Viewing"
            >
              A crisp set of 15x15 icons, balanced and consistent.
            </NavigationMenuListItem>
            <NavigationMenuListItem href="https://lucide.dev/icons/" title="Automation">
              A crisp set of 15x15 icons, balanced and consistent.
            </NavigationMenuListItem>
          </ul>
        </NavigationMenuContent>
      </NavigationMenuItem>

      <NavigationMenuItem>
        <NavigationMenuTrigger>
          <CommonNavButton>Resources</CommonNavButton>
        </NavigationMenuTrigger>
        <NavigationMenuContent
          class="data-[motion=from-start]:animate-enterFromLeft data-[motion=from-end]:animate-enterFromRight data-[motion=to-start]:animate-exitToLeft data-[motion=to-end]:animate-exitToRight flex justify-center"
        >
          <ul
            class="m-0 grid list-none gap-2 grid-cols-3 p-6 max-w-screen-lg bg-foundation-page rounded-md border border-1 border-outline-2 shadow-md"
          >
            <NavigationMenuListItem
              title="Introduction"
              href="/docs/primitives/overview/introduction"
            >
              Build high-quality, accessible design systems and web apps.
            </NavigationMenuListItem>
            <NavigationMenuListItem
              title="Getting started"
              href="/docs/primitives/overview/getting-started"
            >
              A quick tutorial to get you up and running with Reka UI.
            </NavigationMenuListItem>
            <NavigationMenuListItem
              title="Styling"
              href="/docs/primitives/guides/styling"
            >
              Unstyled and compatible with any styling solution.
            </NavigationMenuListItem>
            <NavigationMenuListItem
              title="Animation"
              href="/docs/primitives/guides/animation"
            >
              Use CSS keyframes or any animation library of your choice.
            </NavigationMenuListItem>
            <NavigationMenuListItem
              title="Accessibility"
              href="/docs/primitives/overview/accessibility"
            >
              Tested in a range of browsers and assistive technologies.
            </NavigationMenuListItem>
            <NavigationMenuListItem
              title="Releases"
              href="/docs/primitives/overview/releases"
            >
              Reka UI releases and their changelogs.
            </NavigationMenuListItem>
          </ul>
        </NavigationMenuContent>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <NavigationMenuLink href="/pricing">
          <CommonNavButton>Pricing</CommonNavButton>
        </NavigationMenuLink>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <NavigationMenuLink href="/company">
          <CommonNavButton>Company</CommonNavButton>
        </NavigationMenuLink>
      </NavigationMenuItem>
      <NavigationMenuIndicator
        class="absolute data-[state=hidden]:opacity-0 duration-200 data-[state=visible]:animate-fadeIn data-[state=hidden]:animate-fadeOut top-full w-[--reka-navigation-menu-indicator-size] translate-x-[--reka-navigation-menu-indicator-position] mt-[1px] z-[100] flex h-[10px] items-end justify-center overflow-hidden transition-[all,transform_250ms_ease]"
      >
        <div
          class="relative top-[70%] h-[12px] w-[12px] rotate-[45deg] bg-foundation-2 border border-outline-2"
        />
      </NavigationMenuIndicator>
    </NavigationMenuList>
    <div class="fixed top-full -mt-4 left-1/2 right-1/2 ml-[-50vw] mr-[-50vw] flex">
      <NavigationMenuViewport
        class="w-full overflow-hidden data-[state=open]:animate-scaleIn data-[state=closed]:animate-scaleOut relative mt-[10px] h-[var(--reka-navigation-menu-viewport-height)] origin-[top_center] transition-[width,_height] duration-300"
      />
    </div>
  </NavigationMenuRoot>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuRoot,
  NavigationMenuTrigger,
  NavigationMenuViewport
} from 'reka-ui'
import NavigationMenuListItem from './NavigationMenuListItem.vue'

const currentTrigger = ref('')
</script>
