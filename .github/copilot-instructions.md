---
description: 'Guidelines for writing Node.js and TypeScript code with Vitest testing'
applyTo: 'packages/objectloader2/**/*.ts'
---

# Code Generation Guidelines

## Coding standards

- Use TypeScript with ES2022 features and Node.js (20+) ESM modules
- Use Node.js built-in modules and avoid external dependencies where possible
- Ask the user if you require any additional dependencies before adding them
- Always use async/await for asynchronous code, and use 'node:util' promisify function to avoid callbacks
- Keep the code simple and maintainable
- Use descriptive variable and function names
- Do not add comments unless absolutely necessary, the code should be self-explanatory
- Never use `null`, always use `undefined` for optional values
- Prefer functions over classes

## Testing

- Use Vitest for testing
- Name test files with `.test.ts` suffix
- Write tests for all new features and bug fixes
- Ensure tests cover edge cases and error handling
- NEVER change the original code to make it easier to test, instead, write tests that cover the original code as it is
- Follow the pattern: `describe('Component/Function/Class', () => { it('should do something', () => {}) })`
- Use descriptive test names that explain the expected behavior
- Use nested describe blocks to organize related tests
- Always return promises or use async/await syntax in tests
- Use snapshot tests for UI components or complex objects that change infrequently
- Keep snapshots small and focused
- Review snapshot changes carefully before committing

## Documentation

- When adding new features or making significant changes, update the README.md file where necessary

## User interactions

- Ask questions if you are unsure about the implementation details, design choices, or need clarification on the requirements
- Always answer in the same language as the question, but use english for the generated content like code, comments or docs
