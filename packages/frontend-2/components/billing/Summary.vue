<template>
  <ul>
    <li
      v-for="(item, index) in cost.items"
      :key="item.id"
      class="text-body-xs flex"
      :class="[index === cost.items.length - 1 ? 'border-b border-outline-3' : null]"
    >
      <p
        class="text-foreground flex-1 py-2 px-3"
        :class="[index < cost.items.length - 1 ? 'border-b border-outline-3' : null]"
      >
        {{ item.count }} {{ item.name }}
        <span class="text-foreground-2">x</span>
        £{{ item.cost }}
      </p>
      <p
        class="text-foreground ml-4 w-40 py-2 px-3"
        :class="[index < cost.items.length - 1 ? 'border-b border-outline-3' : null]"
      >
        £{{ item.count * item.cost }} / month
      </p>
    </li>
    <li class="flex justify-between text-foreground font-medium">
      <p class="flex-1 p-3">Subtotal</p>
      <p class="w-40 ml-4 p-3">£{{ cost.subTotal }} / month</p>
    </li>
  </ul>
</template>

<script lang="ts" setup>
defineProps<{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cost: any
}>()
</script>
