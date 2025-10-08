---
description: GraphQL patterns and fragment-based architecture
applyTo: 'packages/frontend-2/**/*.vue,packages/frontend-2/**/*.ts,packages/frontend-2/**/*gql*/**/*,packages/frontend-2/**/*generated*/**/*,packages/ui-components/**/*.vue,packages/ui-components/**/*.ts'
---

# GraphQL Patterns

## Code Generation

- **Generated types** from GraphQL schema
- **Typed hooks** from @vue/apollo-composable
- **Fragment colocation** with components
- **Operation naming** follows schema conventions

## Fragment-Based Architecture

```typescript
// Define component data requirements via fragments
graphql(`
  fragment SomeComponent_Project on Project {
    id
    name
    # Only fields this component needs
  }
`)

defineProps<{
  project: SomeComponent_Project
}>()
```

## Query/Mutation Patterns

```typescript
// Use generated hooks
const { result, loading, error } = useQuery(SomeQuery)
const { mutate, loading: mutating } = useMutation(SomeMutation)

// Handle loading states
const isLoading = computed(() => loading.value || mutating.value)
```

## Data Requirements

- **Always include `id` field** in queries for Apollo cache management
- **Mutations return updated objects** instead of just success booleans
- **Use fragments** to define component data requirements
- **Fragment naming**: `{ComponentName}_{GraphQLType}`

## Examples

### Fragment Definition

```typescript
// UserCard.vue
graphql(`
  fragment UserCard_User on User {
    id
    name
    email
    avatar
  }
`)

defineProps<{
  user: UserCard_User
}>()
```

### Query with Fragments

```typescript
// UsersPage.vue
const { result: usersResult } = useQuery(
  graphql(`
    query UsersPage_Users {
      users {
        id
        ...UserCard_User
      }
    }
  `)
)
```
