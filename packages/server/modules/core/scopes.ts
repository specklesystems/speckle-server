import { Scopes } from '@/modules/core/helpers/mainConstants'

export default [
  {
    name: Scopes.Streams.Read,
    description:
      'Read your streams, and any associated information (branches, commits, objects).',
    public: true
  },
  {
    name: Scopes.Streams.Write,
    description:
      'Create streams on your behalf, and any associated data (branches, commits, objects).',
    public: true
  },
  {
    name: Scopes.Profile.Read,
    description: 'Read your profile information.',
    public: true
  },
  {
    name: Scopes.Profile.Email,
    description: 'Read the email address you registered with.',
    public: true
  },
  {
    name: Scopes.Profile.Delete,
    description: 'Delete the account with all associated data.',
    public: false
  },
  {
    name: Scopes.Users.Read,
    description: "Read other users' profiles.",
    public: true
  },
  {
    name: Scopes.Server.Stats,
    description:
      'Request server stats from the API. Only works in conjunction with a "server:admin" role.',
    public: true
  },
  {
    name: Scopes.Users.Email,
    description: 'Access the emails of other users.',
    public: false
  },
  {
    name: Scopes.Server.Setup,
    description:
      'Edit server information. Note: Only server admins will be able to use this token.',
    public: false
  },
  {
    name: Scopes.Tokens.Read,
    description: 'Access API tokens.',
    public: false
  },
  {
    name: Scopes.Tokens.Write,
    description: 'Create and delete API tokens.',
    public: false
  }
]
