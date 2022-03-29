'use strict'
const { Scopes } = require('@/modules/core/helpers/mainConstants')

module.exports = [
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
    description: 'Read your profile information (name, bio, company).',
    public: true
  },
  {
    name: Scopes.Profile.Email,
    description: 'Grants access to the email address you registered with.',
    public: true
  },
  {
    name: Scopes.Profile.Delete,
    description: 'Allows a user to delete their account, with all associated data.',
    public: false
  },
  {
    name: Scopes.Users.Read,
    description: "Read other users' profile on your behalf.",
    public: true
  },
  {
    name: Scopes.Server.Stats,
    description:
      'Request server stats from the api. Only works in conjunction with a "server:admin" role.',
    public: true
  },
  {
    name: Scopes.Users.Email,
    description: 'Access the emails of other users on your behalf.',
    public: false
  },
  {
    name: Scopes.Server.Setup,
    description:
      'Edit server information. Note: only server admins will be able to use this token.',
    public: false
  },
  {
    name: Scopes.Tokens.Read,
    description: 'Access your api tokens.',
    public: false
  },
  {
    name: Scopes.Tokens.Write,
    description: 'Create and delete api tokens on your behalf.',
    public: false
  }
]
