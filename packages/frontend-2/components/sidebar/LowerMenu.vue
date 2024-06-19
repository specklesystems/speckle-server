<template>
  <div class="flex flex-col items-start gap-1.5">
    <CommonTextLink
      :to="homeRoute"
      size="sm"
      class="!text-foreground-2 hover:!text-foreground !font-normal"
      no-underline
    >
      Changelog
    </CommonTextLink>
    <CommonTextLink
      :to="homeRoute"
      size="sm"
      class="!text-foreground-2 hover:!text-foreground !font-normal"
      no-underline
    >
      Community
    </CommonTextLink>
    <CommonTextLink
      :to="homeRoute"
      size="sm"
      class="!text-foreground-2 hover:!text-foreground !font-normal"
      no-underline
    >
      Documentation
    </CommonTextLink>
    <CommonTextLink
      :to="homeRoute"
      size="sm"
      class="!text-foreground-2 hover:!text-foreground !font-normal"
      no-underline
    >
      Give us feedback
    </CommonTextLink>
  </div>
</template>

<script setup lang="ts"></script>
