# About

Modules under this folder are used to bootstrap a Nuxt-esque environment in other environments like Nuxt, Storybook.

## Special constraints

Modules under this folder have special constraints, considering that they're loaded from storybook/jest. Some of them have to be JS only or possibly even CJS only, and on top of that path aliases might not work here.
