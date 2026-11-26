const gameRecords = require('../repositories/game-records')

class InvalidRecordError extends Error {
  constructor(message) {
    super(message)
    this.name = 'InvalidRecordError'
  }
}

function createRecord(userId, record) {

  const playerIds = record.game_participants
    .filter(participant => participant.player_id !== undefined)
    .map(participant => participant.player_id)
  if (new Set(playerIds).size !== playerIds.length) {
    throw new InvalidRecordError('Each player can participate only once')
  }

  try {
    return gameRecords.createRecord(userId, record)
  } catch (err) {
    if (err instanceof gameRecords.InvalidRecordError) {
      throw new InvalidRecordError(err.message)
    }
    throw err
  }
}

function getRecord(id) {
  return gameRecords.getRecord(id)
}

module.exports = { createRecord, getRecord, InvalidRecordError }
