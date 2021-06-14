'use strict'

module.exports = [
  {
    name: 'streams:read',
    description: 'Read your streams, and any associated information (branches, commits, objects).',
    public: true
  },
  {
    name: 'streams:write',
    description: 'Create streams on your behalf, and any associated data (branches, commits, objects).',
    public: true
  },
  {
    name: 'profile:read',
    description: 'Read your profile information (name, bio, company).',
    public: true
  },
  {
    name: 'profile:email',
    description: 'Grants access to the email address you registered with.',
    public: true
  },
  {
    name: 'profile:delete',
    description: 'Allows a user to delete their account, with all associated data.',
    public: false
  },
  {
    name: 'users:read',
    description: 'Read other users\' profile on your behalf.',
    public: true
  },
  {
    name: 'server:stats',
    description: 'Request server stats from the api. Only works in conjunction with a "server:admin" role.',
    public: true
  },
  {
    name: 'users:email',
    description: 'Access the emails of other users on your behalf.',
    public: false
  },
  {
    name: 'server:setup',
    description: 'Edit server information. Note: only server admins will be able to use this token.',
    public: false
  },
  {
    name: 'tokens:read',
    description: 'Access your api tokens.',
    public: false
  },
  {
    name: 'tokens:write',
    description: 'Create and delete api tokens on your behalf.',
    public: false
  }
]
