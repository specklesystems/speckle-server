<template>
  <div>
    <header>
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 class="text-3xl font-bold leading-tight text-foreground">
          <slot name="title">Design system demo</slot>
        </h1>
      </div>
    </header>
    <main>
      <div class="mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div class="px-4 py-8 sm:px-0">
          <div
            class="h-96 rounded-lg border shadow-sm border-foreground-4 bg-background"
          >
            <div class="p-8">
              <div class="my-8 text-7xl text-foreground">Heyy TW test</div>
              <div class="flex flex-col space-y-2 items-start">
                <FormButton>Test button</FormButton>
                <FormTextInput name="test1" label="Test input:" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
