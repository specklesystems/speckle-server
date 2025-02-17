import { expect } from 'chai'
import { describe, it } from 'mocha'
import { getNameFromUserInfo } from '@/modules/auth/helpers/oidc'

/* eslint-disable camelcase */
describe('getNameFromUserInfo', () => {
  it('should return empty string with no name, given_name and family_name provided', () => {
    expect(getNameFromUserInfo({})).to.equal('')
  })

  it('should return name with name provided', () => {
    const onlyNameProvided = { name: 'name' }
    expect(getNameFromUserInfo(onlyNameProvided)).to.equal('name')

    const fullyPopulated = {
      name: 'name',
      given_name: 'given_name',
      family_name: 'family_name'
    }
    expect(getNameFromUserInfo(fullyPopulated)).to.equal('name')
  })

  it('should return given_name + family_name with no name provided', () => {
    const user = {
      given_name: 'given_name',
      family_name: 'family_name'
    }
    expect(getNameFromUserInfo(user)).to.equal('given_name family_name')
  })

  it('should return given_name with no name and family_name provided', () => {
    const user = {
      given_name: 'given_name'
    }
    expect(getNameFromUserInfo(user)).to.equal('given_name')
  })

  it('should return given_name with no name and family_name provided', () => {
    const user = {
      family_name: 'family_name'
    }
    expect(getNameFromUserInfo(user)).to.equal('family_name')
  })
})
