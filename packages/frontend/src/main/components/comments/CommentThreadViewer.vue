<template>
  <div class="mt-2 pa-1">
    <!-- <div class="d-flex pl-2 xxx-align-center background elevation-2 rounded-xl mb-2">
      <div class="mt-2">
        <user-avatar :id="comment.authorId" :size="30" />
      </div>
      <div class="px-2 py-2 flex-grow-0 body-2">
        Do you agree with a longer comment? {{ comment.text }}
      </div>
    </div> -->
    <template v-for="(reply, index) in replies">
      <div :key="index" :class="`d-flex px-2 mb-4 align-center`">
        <div :class="`${$userId() === reply.authorId ? 'order-last' : ''}`">
          <user-avatar :id="reply.authorId" shadow :size="30" />
        </div>
        <div
          :class="`mx-2 px-4 py-2 flex-grow-1 float-left rounded-xl elevation-5 ${
            $userId() === reply.authorId ? 'primary white--text' : 'background'
          }`"
        >
          {{ reply.text }}
        </div>
      </div>
    </template>
    <div :class="`elevation-4 d-flex px-0 align-center elevation-0 rounded-xl mb-4`">
      <div class="pr-2">
        <user-avatar :id="$userId()" :size="30" />
      </div>
      <div class="px-0 py-4 flex-grow-1 float-left">
        <v-text-field
          label="Reply TODO"
          solo
          hide-details
          flat
          append-icon="mdi-send"
        ></v-text-field>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  components: {
    UserAvatar: () => import('@/main/components/common/UserAvatar')
  },
  props: {
    comment: { type: Object, default: () => null }
  },
  data: function () {
    return {
      replies: [
        {
          authorId: '8ad9fd3601',
          text:
            'The translateZ() CSS function repositions an element along the z-axis in 3D space, i.e., closer to or farther away from the viewer.'
        },
        {
          authorId: '1fe2c52228',
          text:
            'One interesting aspect of a system is that we cannot apply a "divide and conquer" strategy to optimize it for its purpose. If you deal with a problem where all efforts to fix it result in counter-intuitive effects then Systems Thinking can lead to new ideas and may explain why the efforts failed.'
        },
        {
          authorId: '1fe2c52228',
          text: 'Okay, got it.'
        },
        {
          authorId: '8ad9fd3601',
          text: 'Still strange though'
        },
        {
          authorId: '1fe2c52228',
          text: 'More pasta'
        }
      ]
    }
  }
}
</script>
