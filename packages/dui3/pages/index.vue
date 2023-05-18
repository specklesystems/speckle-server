<template>
  <div>
    Hello world
    <Portal to="navigation">
      <HeaderNavLink :to="'/'" :name="'Home'"></HeaderNavLink>
    </Portal>
  </div>
</template>
