import { MessageType } from "./Enums/MessageType";
import { Channel } from "./Enums/Channel";
import { Target } from "./Enums/Target";
import { ProtocolWriter } from "./Protocol/ProtocolWriter";

/**
 * FishNet Client
 * Provides a client API for FishNet networking, similar to PhotonClient
 */
export class FishNetClient {
  constructor({ originalSend, socket }) {
    this.socket = socket;
    this.originalSend = originalSend;
    this.useJSON = true; // Default to JSON protocol
    this.connectionId = -1;
    this.clientId = -1;
    this.isConnected = false;
  }

  /**
   * Sends an RPC call (similar to OpRaiseEvent in Photon)
   * @param {string} methodName - The RPC method name to call
   * @param {Object} parameters - Parameters to pass to the RPC
   * @param {Object} options - RPC options (target, channel, etc.)
   * @returns {boolean} True if sent successfully
   */
  SendRPC(methodName, parameters = {}, options = {}) {
    const {
      target = Target.OTHERS,
      channel = Channel.RELIABLE,
      objectId = null
    } = options;

    const messageType = channel === Channel.RELIABLE
      ? MessageType.RPC_RELIABLE
      : MessageType.RPC_UNRELIABLE;

    const data = {
      methodName: methodName,
      parameters: parameters,
      senderId: this.clientId,
      target: target
    };

    if (objectId !== null) {
      data.objectId = objectId;
    }

    return this.SendMessage(messageType, data);
  }

  /**
   * Raises an event (legacy compatibility with PhotonClient)
   * Maps Photon's OpRaiseEvent to FishNet's RPC system
   * @param {number} eventCode - Event code (converted to RPC method name)
   * @param {Object} customEventContent - Event data
   * @param {Object} raiseEventOptions - Event options
   * @param {Object} sendOptions - Send options
   * @returns {boolean} True if sent successfully
   */
  OpRaiseEvent(eventCode, customEventContent, raiseEventOptions, sendOptions) {
    // Convert Photon event code to FishNet RPC method name
    const methodName = `Event_${eventCode}`;

    // Determine target based on raiseEventOptions
    let target = Target.OTHERS;
    if (raiseEventOptions) {
      if (raiseEventOptions.Receivers === 1) { // ReceiverGroup.All
        target = Target.ALL;
      } else if (raiseEventOptions.Receivers === 2) { // ReceiverGroup.MasterClient
        target = Target.SERVER;
      }
    }

    // Determine channel based on sendOptions
    let channel = Channel.RELIABLE;
    if (sendOptions && !sendOptions.Reliability) {
      channel = Channel.UNRELIABLE;
    }

    return this.SendRPC(methodName, customEventContent, { target, channel });
  }

  /**
   * Sends a message to the server
   * @param {number} messageType - Type of message (from MessageType enum)
   * @param {Object} data - Message data
   * @returns {boolean} True if sent successfully
   */
  SendMessage(messageType, data = {}) {
    if (!this.socket) {
      console.error('Cannot send message: socket not initialized');
      return false;
    }

    const writer = new ProtocolWriter(this.useJSON);
    writer.setMessageType(messageType);
    writer.setTimestamp(Date.now());
    writer.setData(data);

    const buffer = writer.toBuffer();

    try {
      if (this.useJSON) {
        this.originalSend.call(this.socket, buffer);
      } else {
        this.originalSend.call(this.socket, buffer);
      }

      if (MeowEngine.Config.debugOutgoingPackets) {
        console.log('Sending FishNet message:', {
          type: messageType,
          data: data
        });
      }

      return true;
    } catch (error) {
      console.error('Error sending FishNet message:', error);
      return false;
    }
  }

  /**
   * Updates a synchronized variable
   * @param {number} objectId - Object ID
   * @param {string} varName - Variable name
   * @param {*} value - New value
   * @returns {boolean} True if sent successfully
   */
  UpdateSyncVar(objectId, varName, value) {
    const data = {
      objectId: objectId,
      varName: varName,
      value: value
    };

    return this.SendMessage(MessageType.SYNC_VAR, data);
  }

  /**
   * Sends transform synchronization data
   * @param {number} objectId - Object ID
   * @param {Object} position - Position {x, y, z}
   * @param {Object} rotation - Rotation {x, y, z, w}
   * @param {Object} velocity - Optional velocity {x, y, z}
   * @returns {boolean} True if sent successfully
   */
  SyncTransform(objectId, position, rotation, velocity = null) {
    const data = {
      objectId: objectId,
      position: position,
      rotation: rotation
    };

    if (velocity) {
      data.velocity = velocity;
    }

    return this.SendMessage(MessageType.TRANSFORM_SYNC, data);
  }

  /**
   * Requests to change ownership of an object
   * @param {number} objectId - Object ID
   * @param {number} newOwnerId - New owner client ID
   * @returns {boolean} True if sent successfully
   */
  TransferOwnership(objectId, newOwnerId) {
    const data = {
      objectId: objectId,
      newOwnerId: newOwnerId
    };

    return this.SendMessage(MessageType.CHANGE_OWNERSHIP, data);
  }

  /**
   * Sends a ping message to the server
   * @returns {boolean} True if sent successfully
   */
  SendPing() {
    const data = {
      timestamp: Date.now()
    };

    return this.SendMessage(MessageType.PING, data);
  }

  /**
   * Sends authentication data to the server
   * @param {Object} authData - Authentication data
   * @returns {boolean} True if sent successfully
   */
  Authenticate(authData) {
    return this.SendMessage(MessageType.AUTHENTICATE, authData);
  }

  /**
   * Sends connection request
   * @param {Object} connectionData - Connection data
   * @returns {boolean} True if sent successfully
   */
  SendConnectionRequest(connectionData = {}) {
    const data = {
      protocolVersion: "1.0",
      clientVersion: "1.0.0",
      ...connectionData
    };

    return this.SendMessage(MessageType.CONNECTION_REQUEST, data);
  }

  /**
   * Disconnects from the server
   */
  Disconnect() {
    this.SendMessage(MessageType.DISCONNECTION, {
      reason: "Client disconnect"
    });
    this.isConnected = false;
  }

  /**
   * Sets the protocol mode (JSON or binary)
   * @param {boolean} useJSON - True for JSON, false for binary
   */
  setProtocolMode(useJSON) {
    this.useJSON = useJSON;
  }

  /**
   * Sets the connection ID
   * @param {number} connectionId - Connection ID from server
   */
  setConnectionId(connectionId) {
    this.connectionId = connectionId;
  }

  /**
   * Sets the client ID
   * @param {number} clientId - Client ID from server
   */
  setClientId(clientId) {
    this.clientId = clientId;
  }

  /**
   * Marks the client as connected
   * @param {boolean} connected - Connection status
   */
  setConnected(connected) {
    this.isConnected = connected;
  }
}

/**
 * Static helper for ownership transfer
 */
FishNetClient.TransferOwnershipStatic = function (client, objectId, newOwnerId) {
  if (!client || !(client instanceof FishNetClient)) {
    console.error("Invalid FishNetClient instance");
    return false;
  }

  return client.TransferOwnership(objectId, newOwnerId);
};

export default FishNetClient;
