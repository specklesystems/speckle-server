/**
 * Activity stream item action types that shouldn't be displayed in the FE
 */
export const SKIPPABLE_ACTION_TYPES = <const>[
  'stream_invite_sent',
  'stream_invite_declined',
  'stream_access_request_sent',
  'stream_access_request_declined'
]

export const STREAM_CREATED_TYPES = <const>['stream_create', 'stream_clone']
