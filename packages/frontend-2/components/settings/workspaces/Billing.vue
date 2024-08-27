<template>
  <section>
    <div class="md:max-w-xl md:mx-auto pb-6 md:pb-0">
      <SettingsSectionHeader title="Billing" text="Your workspace billing details" />

      <CommonCard class="text-body-xs bg-foundation">
        <p class="text-foreground">
          Workspaces are free while in beta. Afterwards, we will start charging after
          you surpass 500 model versions across all projects.
        </p>
        <p class="text-foreground pt-6">
          You currently have 341 model versions in your workspace.
        </p>
        <CommonProgressBar class="my-3" :current-value="341" :max-value="500" />
        <div class="flex flex-row justify-between">
          <p class="text-foreground-2">
            Current model versions:
            <span class="text-foreground">341</span>
          </p>
          <p class="text-foreground-2">
            Free model versions limit:
            <span class="text-foreground">500</span>
          </p>
        </div>
      </CommonCard>
      <SettingsSectionHeader
        title="What you workspace bill will look like"
        class="pt-6 pb-4 md:pt-10 md:pb-6"
        subheading
      />
      <BillingSummary :cost="cost" />
      <div
        v-if="cost.discount"
        class="flex mt-6 bg-foundation border-dashed border border-success"
      >
        <p class="flex-1 p-3">{{ cost.discount.name }}</p>
        <p class="w-40 ml-4 p-3">£{{ cost.subTotal * cost.discount.amount }} / month</p>
      </div>
      <div v-if="cost.discount" class="p-3 mt-2 flex">
        <p class="text-body-xs text-foreground flex-1">
          Want to claim your {{ cost.discount.name }}? Talk to us!
        </p>
        <div class="pl-4 w-40">
          <FormButton color="primary">Claim discount</FormButton>
        </div>
      </div>
      <SettingsSectionHeader
        title="What's included?"
        class="pt-6 pb-4 md:pt-10 md:pb-6"
        subheading
      />
    </div>
  </section>
</template>

<script setup lang="ts">
const cost = {
  subTotal: 400,
  discount: {
    name: '50% early adopter discount',
    amount: 0.5
  },
  items: [
    {
      count: 2,
      name: 'admin',
      cost: 70
    },
    {
      count: 5,
      name: 'user',
      cost: 50
    },
    {
      count: 2,
      name: 'read/write guests',
      cost: 20
    },
    {
      count: 2,
      name: 'read only guests',
      cost: 0
    }
  ]
}
</script>
