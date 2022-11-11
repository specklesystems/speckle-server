<template>
  <div class="bg-background p-4 text-foreground space-y-4">
    <div>
      <div>Here are the available background colors:</div>
      <code class="bg-foundation-page p-4 m-4 block rounded-lg">
        bg-foundation-page
      </code>
      <code class="bg-foundation p-4 m-4 block rounded-lg">bg-foundation</code>
      <code class="bg-foundation-2 p-4 m-4 block rounded-lg">bg-foundation-2</code>
    </div>
    <div>
      <div>Here are the available foreground colors:</div>
      <ul class="font-bold">
        <li class="text-foreground">text-foreground</li>
        <li class="text-foreground-2">text-foreground-2</li>
      </ul>
    </div>
    <div>
      <div>Here are the available primary variants:</div>
      <div>
        <div class="bg-primary p-2 text-white">primary</div>
        <div class="bg-primary-focus p-2 text-white">primary-focus</div>
        <div class="bg-primary-muted p-2 text-white">primary-muted</div>
      </div>
    </div>
    <div>
      <div>
        Here are the available color variants, each of which also have a 'lighter' and
        'darker' variant to use for hover/focus/highlight states:
      </div>
      <div>
        <div class="bg-danger p-2 text-white">danger</div>
        <div class="bg-danger-lighter p-2 text-white">danger-lighter</div>
        <div class="bg-danger-darker p-2 text-white">danger-darker</div>
        <div class="bg-warning p-2 text-white">warning</div>
        <div class="bg-warning-lighter p-2 text-white">warning-lighter</div>
        <div class="bg-warning-darker p-2 text-white">warning-darker</div>
        <div class="bg-success p-2 text-white">success</div>
        <div class="bg-success-lighter p-2 text-white">success-lighter</div>
        <div class="bg-success-darker p-2 text-white">success-darker</div>
      </div>
    </div>
    <div>
      <div>There are also the disabled state colors:</div>
      <div>
        <div class="bg-disabled p-2 text-white">disabled</div>
        <div class="bg-disabled-muted p-2 text-black">disabled-muted</div>
      </div>
    </div>
    <div>
      <div>
        Here are the available link colors, they're essentially just the primary colors.
      </div>
      <div>
        <div class="bg-primary p-2 text-white">link</div>
        <div class="bg-primary-focus p-2 text-white">link (focused)</div>
      </div>
    </div>
  </div>
</template>
