const { randomBytes } = require('node:crypto')

const sessions = new Map()
const sessionLifetimeMs = 24 * 60 * 60 * 1000

function createSession(userId) {
  const now = Date.now()
  for (const [token, session] of sessions) {
    if (session.expiresAt <= now) sessions.delete(token)
  }
  const token = randomBytes(32).toString('hex')
  sessions.set(token, { userId, expiresAt: now + sessionLifetimeMs })
  return token
}

function getSession(token) {
  const session = sessions.get(token)
  if (session && session.expiresAt <= Date.now()) {
    sessions.delete(token)
    return undefined
  }
  return session
}

module.exports = { createSession, getSession }
