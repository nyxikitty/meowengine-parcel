/**
 * FishNet RPC Target Types
 * Defines who should receive RPC calls
 */

export const Target = {
  SERVER: 0,          // Send to server only
  OTHERS: 1,          // Send to all other clients (not self)
  ALL: 2,             // Send to all clients including self
  OWNER: 3,           // Send to object owner
  OBSERVERS: 4        // Send to all observers of the object
};

export default Target;
