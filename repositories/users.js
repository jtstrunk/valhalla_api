const db = require('../database')

const usp_insertStatement = db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)')
const usp_insertAccountPlayer = db.prepare('INSERT INTO players (display_name, user_id) VALUES (NULL, ?)')
const usp_findStatement = db.prepare('SELECT id, password_hash FROM users WHERE username = ?')
const usp_listStatement = db.prepare('SELECT id, username FROM users ORDER BY id')
const usp_updatePasswordStatement = db.prepare('UPDATE users SET password_hash = ? WHERE id = ? AND username = ?')
const usp_updateDisplayNameStatement = db.prepare('UPDATE players SET display_name = ? WHERE user_id = ?')

class UsernameTakenError extends Error {
  constructor() {
    super('Username already exists')
    this.name = 'UsernameTakenError'
  }
}

class DisplayNameTakenError extends Error {
  constructor() {
    super('Display name already exists')
    this.name = 'DisplayNameTakenError'
  }
}

function insertUser(username, passwordHash) {
  db.exec('BEGIN IMMEDIATE')
  try {
    let id
    try {
      id = usp_insertStatement.run(username, passwordHash).lastInsertRowid
    } catch (err) {
      if (err.code === 'ERR_SQLITE_ERROR' && err.errcode === 2067) {
        throw new UsernameTakenError()
      }
      throw err
    }
    usp_insertAccountPlayer.run(id)
    db.exec('COMMIT')
    return id
  } catch (err) {
    try {
      db.exec('ROLLBACK')
    } catch (rollbackError) {
      throw new AggregateError([err, rollbackError], 'Failed to create user and roll back transaction')
    }
    throw err
  }
}

function findUser(username) {
  return usp_findStatement.get(username)
}

function listUsers() {
  return usp_listStatement.all()
}

function updatePassword(userId, username, passwordHash) {
  return usp_updatePasswordStatement.run(passwordHash, userId, username).changes
}

function updateDisplayName(userId, displayName) {
  try {
    return usp_updateDisplayNameStatement.run(displayName, userId).changes
  } catch (err) {
    if (err.code === 'ERR_SQLITE_ERROR' && err.errcode === 2067) {
      throw new DisplayNameTakenError()
    }
    throw err
  }
}

module.exports = {
  insertUser, findUser, listUsers, updatePassword, updateDisplayName,
  UsernameTakenError, DisplayNameTakenError
}
