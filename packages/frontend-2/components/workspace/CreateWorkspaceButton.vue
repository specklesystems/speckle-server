<template>
  <div class="w-full graphic-design">
    <FormButton
      :disabled="!enableButton"
      full-width
      color="primary"
      @click="isOpen = true"
    >
      New Workspace
    </FormButton>
    <LayoutDialog v-model:open="isOpen">Howdy</LayoutDialog>
  </div>
</template>

<script setup lang="ts">
const { activeUser: user } = useActiveUser()

const enableButton = computed(() => user.value?.role === 'server:admin')

const isOpen = ref(false)
</script>

<style lang="css">
@keyframes cta {
  from {
    transform: scaleX(1) scaleY(1) rotate(-10deg);
  }

  to {
    transform: scaleX(1.25) scaleY(1.1) rotate(10deg);
  }
}

@keyframes ready {
  to {
    background-color: #fff;
  }
}

.graphic-design {
  transform: rotate(-10deg);
  animation-name: cta;
  animation-duration: 950ms;
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
  animation-direction: alternate;
}

.graphic-design:hover {
  animation-duration: 250ms;
}

.graphic-design:hover > button {
  animation-name: ready;
  animation-duration: 100ms;
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
  animation-direction: alternate;
}
</style>
