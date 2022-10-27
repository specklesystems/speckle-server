<template>
  <div class="bg-background p-4 text-foreground space-y-4">
    <div>
      <div>Here are the available background colors:</div>
      <code class="bg-background p-4 m-4 block rounded-lg">bg-background</code>
      <code class="bg-background-2 p-4 m-4 block rounded-lg">bg-background-2</code>
      <code class="bg-background-3 p-4 m-4 block rounded-lg">bg-background-3</code>
    </div>
    <div>
      <div>Here are the available foreground colors:</div>
      <ul class="font-bold">
        <li class="text-foreground">text-foreground</li>
        <li class="text-foreground-2">text-foreground-2</li>
        <li class="text-foreground-3">text-foreground-3</li>
      </ul>
    </div>
    <div>
      <div>Here are the available primary & secondary colors:</div>
      <div>
        <div class="bg-primary p-2 text-white">primary</div>
        <div class="bg-primary-lighter p-2 text-white">primary-lighter</div>
        <div class="bg-secondary p-2 text-white">secondary</div>
      </div>
    </div>
    <div>
      <div>
        Here are the available link colors. The actual color changes according to
        light/dark theme for optimal results & contrast. To achieve the opposite of
        what's resolved for the active theme, use link-lighter.
      </div>
      <div>
        <div class="bg-link p-2 text-white">link</div>
        <div class="bg-link-lighter p-2 text-white">link-inverted</div>
      </div>
    </div>
  </div>
</template>
