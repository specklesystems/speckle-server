---
description: Frontend development best practices for Vue 3, Nuxt 3, TypeScript, and component architecture
applyTo: 'packages/frontend-2/**/*,packages/ui-components/**/*,packages/preview-frontend/**/*,packages/viewer/**/*,packages/viewer-sandbox/**/*'
---

# Frontend Development Best Practices

## Vue 3 & Nuxt 3 Patterns

### Script Setup Organization

Organize code in Vue `<script setup>` blocks similarly to how one would organize code in Vue components in the older Options API.

To make it easier to read & understand these Vue setup functions we try to organize code inside of them consistently - grouping it by type.

Please ensure all of your Vue components/pages organize it like so, from top to bottom:

1. TS type definitions, enums, pure/non-reactive JS constants (e.g. graphql() query definitions)
2. `defineEmits` & `defineProps`
3. Invoked composables (e.g. useGlobalToast, useForm etc.)
4. `ref`s
5. `computed`s
6. function definitions
7. `watch` calls
8. lifecycle hooks (`onMounted` etc.)

This is the ideal layout, but there will be scenarios when you won't be able to do this. For example, a composable might require a `ref` that would have to be created before it. When these scenarios arise you can make exceptions, but for the most part you should still try to organize code like I explained above.

### Follow Vue 3 Style Guide

Follow the Vue 3 style guide in our Vue 3/Nuxt 3+ apps.

Here's the link: https://vuejs.org/style-guide/

### Composable Usage Rules

Always invoke composables only in their allowed scope.

Vue Composables are a special kind of function that rely on being able to figure out which Vue component they are associated with. Without going into too much detail about how it works, this means that you should only invoke composables in the following places:

- In Vue setup() functions or `<script setup>` blocks
- In other (correctly invoked) composables
- In Nuxt plugins

If you don't do this, your composable can break in unexpected ways and cause hard to debug bugs.

```tsx
<script setup>
// BAD: Composable invoked in async click handler
const onClickHandler = () => {
  const {user} = useActiveUser()
  console.log(user.value.id)
}
</script>

<script setup>
// GOOD: Composable invoked in setup() scope
const {user} = useActiveUser()
const onClickHandler = () => {
  console.log(user.value.id)
}
</script>
```

More info: https://vuejs.org/guide/reusability/composables#usage-restrictions

<aside>
🤓 There are certain exceptions like `useNuxtApp()` which can be invoked almost everywhere, but the amount of these kinds of exceptions is small.

</aside>

### Single Root Node Requirement

Vue components should always have a single root node.

Having no root element, a root element that can conditionally disappear or multiple root elements, can cause bugs when rendering that component. The bugs can be hard to figure out - just parts of the UI randomly not rendering with a low-level Vue error.

Always ensure that if the root node is conditional, there is a `v-else` that renders a fallback root node.

```tsx
// Bad: If !someCondition, there's no root node
<template>
  <div v-if="someCondition"/>
</template>

// Good: There's always a root node no matter what
<template>
  <div v-if="someCondition"/>
  <div v-else/>
</template>
```

### Reactive Data Management

Make sure all Vue component data is reactive, unless if you're absolutely sure that it will never change during the app's lifecycle.

If you just store some data in a basic constant, not a ref or a computed, then it's not reactive, and any other templates/computeds/watchers that depend on it will not update when the value changes.

For the most part you want to store everything in refs/computeds/shallowRefs.

```tsx
// BAD: favoriteCount will never update, even if props change
<script setup lang="ts">
const props = defineProps<{account: {favorites: number}}>()
const favoriteCount = props.account.favorites
</script>

// GOOD: favoriteCount will update when its dependencies update
<script setup lang="ts">
const props = defineProps<{account: {favorites: number}}>()
const favoriteCount = computed(() => props.account.favorites)
</script>
```

<aside>
🤓 Even when you have static data that's not ever going to change, if its not reactive and you change it during development (with the dev server running) its not going to update with Hot Reload. Hot Reload depends on data being reactive.

</aside>

### Absolute Imports

Always use absolute imports with the `~` or `~~` prefix for project root references.

This makes it possible to specify all imports with an absolute path like `import { Foo } from ~/lib/foo/types.ts` , so that all imports to `Foo` are importing from the same path.

Relative paths on the other hand are relative, and ever changing. This makes it a lot harder to discover and refactor each import reference of something.

## List Rendering & Keys

### Avoid Array Indices as Keys

Do not use array indices as keys, if possible.

You should not use array indexes as keys since indexes are only indicative of an items position in the array and not an identifier of the item itself.

```tsx
❌ <div v-for="(user, index) in users" :key="index">
```

Why does that matter? Because if a new item is inserted into the array at any position other than the end, when Vue patches the DOM with the new item data, then any data local in the iterated component will not update along with it.

Ideally you should always use some kind of unique identifier associated with each array item as a key instead.

More info on this + a demo on how index keys can cause bugs: https://vueschool.io/articles/vuejs-tutorials/tips-and-gotchas-for-using-key-with-v-for-in-vue-js-3/

## GraphQL Frontend Patterns

### Fragment-Based Architecture

Define GQL requirements for your Vue components (& functions) through GQL fragments.

GQL fragments are re-usable GQL field definitions that can be used in queries, mutations etc. Fragments are ideal for defining the API/data requirements of a Vue component (or composable) - you define a fragment only with the fields you need, and then you can use the GQL Codegen auto-generated type in your `defineProps` call.

When all components are built this way, it's easy to build queries that only ask for what is needed and not more - you just build a query out of all the fragments for the components you're rendering.

If you don't do this, however, all of requirements of your Vue components are expressed directly in GQL operation strings without any link back to the component that needs them. Thus it's completely unclear which fields are actually needed and why. As the app grows in size and complexity, there tends to be more overfetching of data and wasteful API calls.

```tsx
// some/random/Component.vue

<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import type { SomeRandomComponent_Project } from '~~/lib/common/generated/gql/graphql'

// Fragment name is: {FullComponentName}_{GqlObjectType}
graphql(`
  fragment SomeRandomComponent_Project on Project {
    id
  }
`)

defineProps<{
  project: SomeRandomComponent_Project
}>()
</script>
```

Read more about this approach here: https://the-guild.dev/blog/unleash-the-power-of-fragments-with-graphql-codegen

### Always Include ID Fields

Always ask back for an `id` field for any GQL objects you query to ensure Apollo cache can be updated, where necessary.

More info: https://www.apollographql.com/docs/react/data/mutations/#include-modified-objects-in-mutation-responses

Whenever a query/subscription/mutation response is received back from server, Apollo Client will see if there are any objects in the local cache that need updating, and doing that relies on the objects having a clear type name and ID. The type name can be inferred automatically, but the `id` field is something you have to ask for explicitly in your operations.

```tsx
// BAD
graphql(`
  query Project($id: String!) {
    project {
      name
      ...SomeFragment
    }
  }
`)

// GOOD
graphql(`
  query Project($id: String!) {
    project {
      id
      name
      ...SomeFragment
    }
  }
`)
```

### Vue component naming in templates

Component names from `./components/**` should be used in PascalCase in templates and their names are built out of their ancestor directories.

Examples and patterns:

```
// ./components/Project/DetailsCard.vue -> <ProjectDetailsCard />
// ./components/Project/Settings/PrivacySettings.vue -> <ProjectSettingsPrivacySettings />
// ./components/Project/Settings/SettingsView.vue -> <ProjectSettingsView />
// ./components/global/Button.vue -> <Button />
```
