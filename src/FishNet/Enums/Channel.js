/**
 * FishNet Channel Types
 * Defines the different channels for message delivery
 */

export const Channel = {
  RELIABLE: 0,        // Guaranteed delivery, ordered
  UNRELIABLE: 1,      // No delivery guarantee, unordered
  RELIABLE_ORDERED: 2 // Guaranteed delivery and order
};

export default Channel;
