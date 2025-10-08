---
description: General development best practices for Git, GitHub, TypeScript, file naming, and package management
applyTo: '**/*.{ts,js,json,md}'
---

# General Development Best Practices

## Git & GitHub

### Semantic Commit Messages

Make sure the final commits going into `main` are based on Semantic Commit messages.

You can find the spec here: https://www.conventionalcommits.org/en/v1.0.0/#summary

It allows us to embed more useful meaning to the messages.

When working with PRs, you have to ensure that your PRs title follows this format, cause that's the string that's going to be used for the final squashed commit message.

### Squash PR Merges

Always squash your PR when merging it into `main`.

All of your feature branch commits should be squashed into one, that can be done through GitHub's UI.

If you don't do it, `main` history and subsequently the changelog is gonna be littered with all kinds of super specific commits, all relevant only to a single feature and ultimately irrelevant to anyone actually going through the history of `main`.

## File Organization

### CamelCase File Naming

All source code files should be named in camelCase (JavaScript ecosystem standard).

```tsx
// BAD:
some - file.ts
some_file.ts
SomeFile.js

// GOOD:
someFile.css
```

<aside>
🤓 There are some exceptions like `server` migration file names, which have the convention of being named in snake_case.

</aside>

## Package Management

### Careful with Package Resolutions

Don't define new "resolutions" in the `package.json` unless absolutely necessary, and if you do - be as specific about the location of the (indirect) dependency as possible.

The problem with resolutions, especially strict ones (e.g. ones that start with `^` and thus only allow a single major version) is that they can break more complicated dependency updates (e.g. a nuxt update) without it being clear that they're doing so. It will not always be a clear and explicit build error, if the dependency being pinned is something relatively unimportant, and the problem might appear as a hard to debug bug during runtime.

Imagine that `nuxt` relies on foo@4.0.0, but we have pinned it to be only ^3.0.0. There won't be any errors, we'll just get 3.0.0 installed and only during runtime we may possibly notice that something is busted.

A way to avoid fallout like this is to only set a resolution for a specific dependency in a specific dependency chain - e.g. not just "nuxt", but "frontend-2/nuxt" or "frontend-2/dep-x/dep-y/nuxt". That way only that specific instance of nuxt will be pinned.

_tl;dr;_ The main valid use cases for permanent resolutions are for when we want to enforce a single version across the entire monorepo, like for our own dev tools (eslint, prettier, typescript etc.). If you just want to update an indirect dependency, then add the resolution, but once yarn.lock is updated remove the resolution and run `yarn` again.

### Engine Requirements

When setting an `engines` requirement in a `package.json`, remember that this not only applies to maintainers, but people installing the package.

You might want to set `engines` to node v20, cause that's we could develop on, but this will also throw errors for anyone installing the package on an earlier node version.

So always make sure `engines` is set to something that both package maintainers and consumers can support.

## TypeScript Best Practices

### Use Type Guards Instead of Type Assertions

Use type guards to validate/improve a value's type, instead of just force casting it with `as` or `<type>`.

Every time you do `someVal as Type` you're essentially turning TypeScript off and saying "It doesn't matter what you think that is, this is what it actually is". The problem with that is it's brittle - You may think that `someVal` is always gonna be `Type`, but it might not be in some edge cases. Or maybe someone changes the code in the future (maybe even in some other seemingly unrelated place) which in turn causes `someVal` to sometimes be something else.

In most cases it's better to do proper type narrowing instead: Checking for undefineds, using type guard predicates to narrow types etc.

More info on type guards: https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates

```tsx
// BAD: The array value might not be found
const firstUser = users.find((u) => u.id === searchId) as User
console.log(firstUser.name) // potential error if user is not found

// GOOD: We handle firstUser potentially being undefined
const firstUser = users.find((u) => u.id === searchId)
if (!firstUser) return
console.log(firstUser.name)
```

```tsx
// BAD: There's multiple potential types and our type assertion may be wrong
const filters: Array<StringFilter | NumericFilter | BooleanFilter> = ...
const stringFilter = filters[0] as StringFilter

// GOOD: We're using a type guard fn to figure out a more specific type
const isStringFilter = (filter: StringFilter | NumericFilter | BooleanFilter): filter is StringFilter =>
  isObjectLike(filter) && get(filter, 'type') === 'string'
const stringFilter = isStringFilter(filters[0]) ? filters[0] : undefined
```

### Constants and Enums Over Magic Strings

Don't keep duplicating magic strings/string literals - use constants or enums instead.

When you have string values that are constants - keep them inside of actual JS constants or enums, instead of duplicating the full string literal value every time you want to use it.

```tsx
// BAD: Duplicated string literals everywhere
type ProjectType = 'public' | 'private'
...
const project = { id: createId(), type: 'public' }
...
const projects = getProjectsByType('public')

// GOOD: Constants stored in actual JS variables - enums or consts
enum ProjectType {
  Public = 'public',
  Private = 'private'
}
const reservedWorkspaceId = 'specialWorkspaceId'
...
const project = { id: createId(), type: ProjectType.Public, workspaceId: reservedWorkspaceId }
...
const projects = getProjectsByType(ProjectType.Public)
```

The reasoning for that is as follows:

- DX is better when working with consts/enums. While you may get some intellisense if you're typing out string literals into a variable/return that is already typed as the expected type (e.g. `ProjectType`), you will not get any when typing them out anywhere else. So more often than not you have to actually remember the values and fully type them out. With consts/enums, you can quickly auto-import them and get intellisense about what their names are, and that's anywhere in the codebase, regardless where you're storing that value.
- More DRY that way. If we ever have to change the underlying value, you have to do it in every single place where that string is typed out. With a const/enum, you only have to do that in one place - the definition.

### Co-locate Types with Implementation

Co-locate function & their arg types with the implementation, if the types don't have to live in the domain layer.

This makes it easier to read the code - the actual function code is kept close to the types of the function and its arguments.

The only times you shouldn't do this are when there are other concerns, like when the function is a service call that describes a core domain activity and thus the type has to live in the domain folder.

## Function Design

### Object Parameters Over Positional Parameters

Use object parameters instead ordered/positional parameters.

```tsx
const thisHasPositionalParameters = (
  a: string,
  b: string,
  c: string,
  d = 'default'
) => {}
const thisHasAnObjectParameter = (params: {
  a: string
  b: string
  c: string
  d?: string
}) => {
  const { a, b, c, d = 'default' } = params
}
```

There are a couple of downsides to ordered parameters:

1. They are ordered. Meaning, you always have to define them in the same order and you have to set values for all of the ones before the the one you want to set, even if they're optional. E.g. if you have a function like `func(a,b = 1,c = 1, d = 1)` even tho `b` and `c` are optional, you have to set them if you want to set `d`: `func(1,1,1,10)`
2. If there are optional params already and you want to add a new non-optional param, you have to add it before the optional ones (this is a standard ESLint rule). But when doing so, you're essentially breaking the API contract and have to fix **all** usages of that function. E.g. if you want to add a new non-optional param called `e` to the previously mentioned function, like so: `func(a, e, b = 1, c = 1, d = 1)`, all existing usages are gonna be broken because they're working under the assumption that the 2nd param is `b = 1`.
3. Since they're not named, its harder to remember which params come in which order, at least if VSCode doesn't help you out by showing the function signature type

Object parameters don't have any of those downsides - you can set params in any order and adding new ones is optional.

### Two-Parameter Pattern for Options

Keep the first function parameter object for the main parameters, and introduce a 2nd optional and partial one (2nd positional arg) for optional options.

```tsx
const getUserById = (
  params: { userId: string },
  options?: Partial<{ enableLogging: boolean }>
) => {}
```

While you could add these less important/optional options into the param object, it complicates it and makes the function harder to learn, cause the main/important parameters are all mixed together with some optional ones that you usually won't care about - if you're new to the function, you want to know which one of the params are actually important. This kind of approach simplifies the function's API and gives clues on which params are more or less important.

Make sure the options object is optional and partial - meaning, you can omit it altogether, and all of its properties are optional as well.

<aside>
🤓 You may argue that you can achieve the same through optional params in the first object. But just because a parameter is optional, doesn't necessarily say that it's not important. Maybe 70% of the time you do want to set it, and then only occasionally it's fine to omit.

</aside>
