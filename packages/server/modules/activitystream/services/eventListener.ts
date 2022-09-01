import { saveActivity } from '@/modules/activitystream/services'
import { UsersEmitter, UsersEvents } from '@/modules/core/events/usersEmitter'

/**
 * Initialize event listener for tracking various Speckle events and responding
 * to them by creating activitystream entries
 */
export function initializeEventListener() {
  const quitCbs = [
    UsersEmitter.listen(UsersEvents.Created, async ({ user }) => {
      await saveActivity({
        streamId: null,
        resourceType: 'user',
        resourceId: user.id,
        actionType: 'user_create',
        userId: user.id,
        info: { user },
        message: 'User created'
      })
    })
  ]

  return () => quitCbs.forEach((quit) => quit())
}
