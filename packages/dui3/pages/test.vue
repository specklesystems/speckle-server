<template>
  <div>Hello test bindings page!</div>
  <div><FormButton size="xs" @click="sayHi()">sayHi</FormButton></div>
  <div><FormButton size="xs" @click="goAway()">goAway</FormButton></div>
  <div><FormButton size="xs" @click="getComplexType()">getComplexType</FormButton></div>
  <div><FormButton size="xs">SayHi</FormButton></div>
  <hr />
  <div>
    <FormButton size="xs" @click="triggerEmptyEvent()">
      Trigger empty test event
    </FormButton>
  </div>
  <div>
    <FormButton size="xs" @click="triggerEvent()">Trigger test event</FormButton>
  </div>
</template>

<script setup lang="ts">
import { ComplexType, TestEventArgs } from '~/lib/bindings/definitions/testBindings'

const { $testBindings } = useNuxtApp()

$testBindings.on('emptyTestEvent', () => {
  console.log('empty test event catched!')
})

$testBindings.on('testEvent', (args: TestEventArgs) => {
  console.log('test event catched!')
  console.log(args)
})

async function triggerEmptyEvent() {
  await $testBindings.triggerEvent('emptyTestEvent')
}

async function triggerEvent() {
  await $testBindings.triggerEvent('testEvent')
}

async function sayHi() {
  const res = await $testBindings.sayHi('Oguzhan', 3, true)
  console.log(res)
}

async function goAway() {
  const res = await $testBindings.goAway()
  console.log(res)
}

async function getComplexType() {
  const res = (await $testBindings.getComplexType()) as ComplexType
  console.log(res)
}
</script>
