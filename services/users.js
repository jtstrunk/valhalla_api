const { randomBytes } = require('node:crypto')
const users = require('../repositories/users')
const { createSession } = require('../sessions')
const { scryptAsync } = require('../credentials')

class AccountMismatchError extends Error {
  constructor() {
    super('Username does not match the authenticated account')
    this.name = 'AccountMismatchError'
  }
}

class PlayerNotFoundError extends Error {
  constructor() {
    super('No player is linked to this account')
    this.name = 'PlayerNotFoundError'
  }
}

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  const hash = await scryptAsync(password, salt, 64)
  return `scrypt:${salt}:${hash.toString('hex')}`
}

async function createUser(username, password) {
  const passwordHash = await hashPassword(password)
  const id = users.insertUser(username, passwordHash)
  const token = createSession(id)
  
  return { id, username, token }
}

function listUsers() {
  return users.listUsers()
}

async function resetPassword(userId, username, password) {
  const passwordHash = await hashPassword(password)
  if (users.updatePassword(userId, username, passwordHash) !== 1) {
    throw new AccountMismatchError()
  }
}

function updateDisplayName(authenticatedUserId, userId, displayName) {
  if (authenticatedUserId !== userId) {
    throw new AccountMismatchError()
  }
  if (users.updateDisplayName(userId, displayName) === 0) {
    throw new PlayerNotFoundError()
  }
}

module.exports = {
  createUser,
  listUsers,
  resetPassword,
  updateDisplayName,
  AccountMismatchError,
  PlayerNotFoundError,
  UsernameTakenError: users.UsernameTakenError,
  DisplayNameTakenError: users.DisplayNameTakenError
}
