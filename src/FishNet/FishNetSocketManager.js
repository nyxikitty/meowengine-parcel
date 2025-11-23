import MeowEngine from "../Browser/GlobalTypeDefs";
import { ProtocolReader } from "./Protocol/ProtocolReader";
import { FishNetClient } from "./FishNetClient";
import { MessageType } from "./Enums/MessageType";

/**
 * FishNet Socket Manager
 * Manages WebSocket connections and FishNet protocol handling
 */
export class FishNetSocketManager {
  static packetCount = 0;
  static firstPacket = true;

  /**
   * Override the WebSocket constructor to intercept FishNet traffic
   */
  static overrideSocket() {
    const originalSend = WebSocket.prototype.send;
    const OriginalWebSocket = WebSocket;

    window.WebSocket = function(url, protocols) {
      // Create the original WebSocket
      const socket = new OriginalWebSocket(url, protocols);

      // Create FishNet client instance
      const fishNetClient = new FishNetClient({ originalSend, socket });

      // Set up global references
      MeowEngine.FishNetClient = MeowEngine.FishNetClient || {};
      MeowEngine.FishNetClient.Instance = fishNetClient;
      MeowEngine.FishNetClient.gameSocket = socket;

      // Map to legacy PhotonClient references for compatibility
      MeowEngine.PhotonClient = MeowEngine.PhotonClient || {};
      MeowEngine.PhotonClient.Instance = fishNetClient;
      MeowEngine.PhotonClient.gameSocket = socket;

      // Set up networking APIs
      MeowEngine.Networking = MeowEngine.Networking || {};
      MeowEngine.Networking.TransferOwnership = fishNetClient.TransferOwnership.bind(fishNetClient);

      MeowEngine.LoadBalancingClient = MeowEngine.LoadBalancingClient || {};
      MeowEngine.LoadBalancingClient.OpRaiseEvent = fishNetClient.OpRaiseEvent.bind(fishNetClient);

      // Override send method to intercept outgoing messages
      socket.send = function(...args) {
        FishNetSocketManager.handleOutgoingMessage(socket, originalSend, args, fishNetClient);
      };

      // Listen for incoming messages
      socket.addEventListener('message', (event) => {
        FishNetSocketManager.handleIncomingMessage(event, fishNetClient);
      });

      // Listen for connection events
      socket.addEventListener('open', () => {
        console.log('[FishNet] WebSocket connected:', url);
        fishNetClient.setConnected(true);
        FishNetSocketManager.firstPacket = true;
      });

      socket.addEventListener('close', (event) => {
        console.log('[FishNet] WebSocket closed:', event.code, event.reason);
        fishNetClient.setConnected(false);
      });

      socket.addEventListener('error', (error) => {
        console.error('[FishNet] WebSocket error:', error);
      });

      return socket;
    };

    console.log('[FishNet] Socket manager initialized');
  }

  /**
   * Handle outgoing messages
   */
  static handleOutgoingMessage(socket, originalSend, args, fishNetClient) {
    try {
      const data = args[0];

      // Parse the outgoing message
      const reader = new ProtocolReader(data);
      const message = reader.getMessage();

      if (MeowEngine.Config.debugOutgoingPackets) {
        console.log('[FishNet] Outgoing message:', message);
      }

      // Emit event for patches to intercept
      if (window.MeowEngine?.Events?.OpRaiseEvent) {
        window.MeowEngine.Events.OpRaiseEvent.emit('data', {
          message,
          reader,
          socket,
          originalSend,
          args
        });
      }

      // Cache outgoing packets if enabled
      if (MeowEngine.Config.cacheOutgoingPhotonPackets) {
        const roomKey = FishNetSocketManager.getRoomKey();
        if (!MeowEngine.RoomInstance.CachedOutgoingPackets[roomKey]) {
          MeowEngine.RoomInstance.CachedOutgoingPackets[roomKey] = [];
        }
        MeowEngine.RoomInstance.CachedOutgoingPackets[roomKey].push(message);
      }

      FishNetSocketManager.packetCount++;
    } catch (error) {
      console.error('[FishNet] Error handling outgoing message:', error);
    }

    // Send the original message
    originalSend.apply(socket, args);
  }

  /**
   * Handle incoming messages
   */
  static handleIncomingMessage(event, fishNetClient) {
    try {
      const data = event.data;

      // Parse the incoming message
      const reader = new ProtocolReader(data);
      const message = reader.getMessage();

      if (MeowEngine.Config.debugIncomingPackets) {
        console.log('[FishNet] Incoming message:', message);
      }

      // Update connection info on first approved connection
      if (FishNetSocketManager.firstPacket && message.type === MessageType.CONNECTION_APPROVED) {
        FishNetSocketManager.firstPacket = false;
        if (message.data.connectionId) {
          fishNetClient.setConnectionId(message.data.connectionId);
        }
        if (message.data.clientId) {
          fishNetClient.setClientId(message.data.clientId);
        }
      }

      // Emit event for patches to intercept
      if (window.MeowEngine?.Events?.OnEvent) {
        window.MeowEngine.Events.OnEvent.emit('data', {
          message,
          reader,
          event
        });
      }

      // Cache incoming packets if enabled
      if (MeowEngine.Config.cacheIncomingPhotonPackets) {
        const roomKey = FishNetSocketManager.getRoomKey();
        if (!MeowEngine.RoomInstance.CachedIncomingPackets[roomKey]) {
          MeowEngine.RoomInstance.CachedIncomingPackets[roomKey] = [];
        }
        MeowEngine.RoomInstance.CachedIncomingPackets[roomKey].push(message);
      }

      // Handle specific message types
      FishNetSocketManager.handleMessageType(message, fishNetClient);

      FishNetSocketManager.packetCount++;
    } catch (error) {
      console.error('[FishNet] Error handling incoming message:', error);
    }
  }

  /**
   * Handle specific message types
   */
  static handleMessageType(message, fishNetClient) {
    const { type, data } = message;

    switch (type) {
      case MessageType.CONNECTION_APPROVED:
        console.log('[FishNet] Connection approved, client ID:', data.clientId);
        break;

      case MessageType.CONNECTION_REJECTED:
        console.error('[FishNet] Connection rejected:', data.reason);
        break;

      case MessageType.AUTH_RESPONSE:
        if (data.success) {
          console.log('[FishNet] Authentication successful');
        } else {
          console.error('[FishNet] Authentication failed');
        }
        break;

      case MessageType.SPAWN_OBJECT:
        console.log('[FishNet] Object spawned:', data.objectId);
        break;

      case MessageType.DESPAWN_OBJECT:
        console.log('[FishNet] Object despawned:', data.objectId);
        break;

      case MessageType.PONG:
        // Handle pong response
        break;

      case MessageType.TIME_SYNC:
        // Handle time synchronization
        break;
    }
  }

  /**
   * Get room key for caching
   */
  static getRoomKey() {
    const roomName = MeowEngine.RoomInstance?.RoomName || 'Unknown';
    const roomId = MeowEngine.RoomInstance?.RoomId || 'Unknown';
    return `${roomName} ${roomId}`;
  }
}

export default FishNetSocketManager;
