<template>
  <div>
    <template v-if="representsCreation">
      {{ streamDescription }}
    </template>
    <template v-else-if="activityItem && activityItem.info && activityItem.info.new">
      <template v-for="(val, key) in activityItem.info.new">
        <p v-if="isUpdatedInfoKeyChanged(key)" :key="key">
          <template v-if="key === UpdatedInfoKeys.Name">
            ✏️ Renamed from
            <i>
              <del>
                {{ activityItem.info.old[key] }}
              </del>
            </i>
            to
            <i>{{ val }}</i>
          </template>
          <template v-else-if="key === UpdatedInfoKeys.Description">
            📋 Description changed from
            <i>
              <del>
                {{ truncate(activityItem.info.old[key] || 'empty') }}
              </del>
            </i>
            to
            <i>
              {{ truncate(val) }}
            </i>
          </template>
          <template v-else-if="key === UpdatedInfoKeys.Message">
            📋 Message changed from
            <i>
              <del>
                {{ truncate(activityItem.info.old[key] || 'empty') }}
              </del>
            </i>
            to
            <i>
              {{ truncate(val) }}
            </i>
          </template>
          <template v-else-if="key === UpdatedInfoKeys.IsPublic">
            👀 Stream is now
            <i>
              {{ val ? 'public' : 'private' }}
            </i>
          </template>
          <template v-else-if="key === UpdatedInfoKeys.IsDiscoverable">
            📺 Stream is now
            <i>
              {{ val ? 'discoverable' : 'not discoverable' }}
            </i>
          </template>
        </p>
      </template>
    </template>
  </div>
</template>
<script>
const ActionTypes = {
  StreamCreate: 'stream_create',
  BranchCreate: 'branch_create'
}

const UpdatedInfoKeys = {
  Name: 'name',
  Description: 'description',
  Message: 'message',
  IsPublic: 'isPublic',
  IsDiscoverable: 'isDiscoverable'
}

export default {
  name: 'ListItemActivityDescription',
  props: {
    activityGroup: {
      type: Array,
      required: true
    },
    activityItemIndex: {
      type: Number,
      required: true
    }
  },
  data: () => ({ UpdatedInfoKeys }),
  computed: {
    activityItem() {
      return this.activityGroup[this.activityItemIndex]
    },
    lastActivityItem() {
      return this.activityGroup[0]
    },
    actionType() {
      return this.activityItem.actionType
    },
    /**
     * Whether the activity item represents a creation (of a stream/branch)
     */
    representsCreation() {
      return [ActionTypes.StreamCreate, ActionTypes.BranchCreate].includes(
        this.activityItem.actionType
      )
    },
    streamDescription() {
      if (this.activityItem.actionType === ActionTypes.StreamCreate) {
        return this.activityItem.info?.stream?.description
          ? this.truncate(this.lastActivityItem.info?.stream?.description, 50)
          : ''
      } else if (this.activityItem.actionType === ActionTypes.BranchCreate) {
        return this.activityItem?.info?.branch?.description
          ? this.truncate(this.lastActivityItem.info?.branch?.description, 50)
          : ''
      }

      return null
    }
  },
  methods: {
    truncate(inputText, length = 25) {
      return (inputText?.length || 0) > length
        ? inputText.substring(0, length) + '...'
        : inputText
    },
    isUpdatedInfoKeyChanged(key) {
      const oldVal = this.activityItem.info?.old[key]
      const newVal = this.activityItem.info?.new[key]

      return oldVal !== undefined && newVal !== oldVal
    }
  }
}
</script>
