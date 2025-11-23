/**
 * FishNet Message Types
 * Defines the different types of messages that can be sent/received via FishNet
 */

export const MessageType = {
  // Connection Management
  CONNECTION_REQUEST: 0,
  CONNECTION_APPROVED: 1,
  CONNECTION_REJECTED: 2,
  DISCONNECTION: 3,

  // Authentication
  AUTHENTICATE: 10,
  AUTH_RESPONSE: 11,

  // Game Management
  SPAWN_OBJECT: 20,
  DESPAWN_OBJECT: 21,
  CHANGE_OWNERSHIP: 22,

  // Data Synchronization
  RPC_RELIABLE: 30,
  RPC_UNRELIABLE: 31,
  SYNC_VAR: 32,
  TRANSFORM_SYNC: 33,

  // System
  PING: 40,
  PONG: 41,
  TIME_SYNC: 42
};

export default MessageType;
