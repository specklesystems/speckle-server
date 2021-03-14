
module.exports = {
  async createInvite( { email, inviter, message } ) {
    // TODO:
    // check if email is already registered as a user
    // check if email is already invited
  },

  async getInviteById( { id } ) {
    // TODO
  },

  async getInviteByEmail( { email } ) {
    // TODO
  },

  async useInvite( { id } ) {
    // TODO
  }
}
