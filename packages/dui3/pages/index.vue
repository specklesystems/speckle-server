<template>
  <div class="flex items-center justify-center h-[calc(100vh-14rem)]">
    <div
      class="p-2 bg-primary text-foreground-on-primary shadow-md rounded-md font-bold"
    >
      <div>
        <FormButton @click="sketchupReceive()">Sketchup Receive</FormButton>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import ObjectLoader from '@speckle/objectloader'

const { $sketchupReceiveBinding } = useNuxtApp()

async function sketchupReceive() {
  const objectId = '745ea505d154c09e2317121bd263a2b2'
  const streamId = '1ce562e99a'
  // Let sketchup know receive will start
  await $sketchupReceiveBinding.beforeReceive(streamId, objectId)

  const loader = new ObjectLoader({
    serverUrl: 'https://speckle.xyz',
    streamId,
    objectId
  })

  const t0 = Date.now()

  const batches = []
  for await (const obj of loader.getObjectIterator()) {
    batches.push(obj)
  }

  // const rootObj = await loader.getAndConstructObject(() => {})
  // await $sketchupReceiveBinding.receiveObject(streamId, objectId, rootObj)
  // console.log(rootObj)

  await $sketchupReceiveBinding.receiveObject(streamId, objectId, batches)

  const t1 = Date.now()
  const elapsedTime = (t1 - t0) / 1000
  console.log(`receive time: ${elapsedTime} second`)

  await $sketchupReceiveBinding.afterReceive(streamId, objectId)
}
</script>
