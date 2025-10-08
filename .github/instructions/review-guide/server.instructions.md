---
description: Backend development best practices for Node.js, TypeScript, GraphQL, and API design
applyTo: 'packages/server/**/*,packages/webhook-service/**/*,packages/fileimport-service/**/*,packages/preview-service/**/*,packages/monitor-deployment/**/*,packages/shared/**/*'
---

# Backend Development Best Practices

## Architecture & Design Patterns

### Factory Pattern for Dependency Injection

Ensure all functions more complicated than simple dependency-less utils/helpers follow the factory pattern to support those external dependencies being injected ([Dependency Injection](https://en.wikipedia.org/wiki/Dependency_injection)).

We achieve this through Higher-order factory functions - functions that (take in dependencies through params and) return other functions (that accept the actual params for the function you want to write).

Here's a basic example:

```tsx
const getUserByIdFactory = (deps: { db: knex.Db }) => (params: { userId: string }) => {
  const { db } = deps
  const { userId } = params

  return await db.from('Users').where('userId', userId).first()
}

// Create getUserById version with any kind of DB instance you want
const getUserById = getUserByIdFactory({ db: myCustomDatabase })
const user = await getUserById({ userId: '123' })
```

This not only allows for a greater separation of concerns, but also testability, since you're able to properly unit test these functions by mocking out all dependencies, and an easy way to run the function with different dependencies (e.g. you want different databases from different regions in some scenarios).

### Factory Function Naming

Factory functions should have a `Factory` suffix.

This makes the code clearer in two ways:

- You know which functions are factories just by their name
- When a factory is invoked, you don't have to spend time coming up with an arbitrarily different name for its resulting function, you can just remove the `Factory` suffix

```tsx
// BAD: No factory suffix
const createUser = (deps: {db: Knex}) => (..) => {}

// Weird name for factory result:
const createUserFunc = createUser({db})

// GOOD: Factory suffix
const createUserFactory = (deps: {db: Knex}) => (..) => {}

// Easy to come up with & understand name for factory result
const createUser = createUserFactory({db})
```

## TypeScript Best Practices

### Explicit Return Types for Public Functions

Ensure public-facing (exported) functions have an explicit return type.

TypeScript can implicitly figure out the return type based on what you're actually returning in the function, so that you don't need to explicitly write it down. But this comes with the cost of it being easy to accidentally change the return type (and thus breaking the API contract) without knowing it.

So just as we're explicit about parameter types, we want to be explicit about return types so that any changes to them are explicit and verified.

This is only required for exported/public functions - internal functions to a module are essentially implementation details that have more relaxed rules.

### Absolute Imports

Always use absolute imports with the `@` symbol for project root references.

This makes it possible to specify all imports with an absolute path like `import { Foo } from @/modules/foo/types.ts` , so that all imports to `Foo` are importing from the same path.

Relative paths on the other hand are relative, and ever changing. This makes it a lot harder to discover and refactor each import reference of something.

## GraphQL Best Practices

### Mutations Should Return Updated Objects

GraphQL Mutations should return the object(s) updated, when possible.

Instead of just returning a `Boolean` value indicating success, return the actual entity that was updated, so that the client (frontend) can immediately ask back for any updated fields without having to do a refetch.

https://www.apollographql.com/docs/react/data/mutations/#include-modified-objects-in-mutation-responses

### Error Handling

[[draft] error throwing](https://www.notion.so/draft-error-throwing-cf7df79ba3a6499eb625913dad90f897?pvs=21)
