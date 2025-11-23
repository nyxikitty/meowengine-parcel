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

      // FishNet uses its own binary protocol - don't try to parse it
      // Just pass it through and log that we sent it
      if (MeowEngine.Config.debugOutgoingPackets) {
        const size = data instanceof ArrayBuffer ? data.byteLength : (data.length || 0);
        console.log(`[FishNet] Outgoing packet (${size} bytes)`);
      }

      // Emit event for patches to intercept (pass raw data)
      if (window.MeowEngine?.Events?.OpRaiseEvent) {
        window.MeowEngine.Events.OpRaiseEvent.emit('data', {
          data: data,
          socket: socket,
          originalSend: originalSend,
          args: args,
          raw: true
        });
      }

      // Cache outgoing packets if enabled (store raw data)
      if (MeowEngine.Config.cacheOutgoingPhotonPackets) {
        const roomKey = FishNetSocketManager.getRoomKey();
        if (!MeowEngine.RoomInstance.CachedOutgoingPackets[roomKey]) {
          MeowEngine.RoomInstance.CachedOutgoingPackets[roomKey] = [];
        }
        MeowEngine.RoomInstance.CachedOutgoingPackets[roomKey].push({
          timestamp: Date.now(),
          size: data instanceof ArrayBuffer ? data.byteLength : (data.length || 0),
          raw: true
        });
      }

      FishNetSocketManager.packetCount++;
    } catch (error) {
      console.error('[FishNet] Error handling outgoing message:', error);
    }

    // Send the original message (pass through unmodified)
    originalSend.apply(socket, args);
  }

  /**
   * Handle incoming messages
   */
  static handleIncomingMessage(event, fishNetClient) {
    try {
      const data = event.data;

      // FishNet uses its own binary protocol - don't try to parse it
      // Just pass it through and log that we received it
      if (MeowEngine.Config.debugIncomingPackets) {
        const size = data instanceof ArrayBuffer ? data.byteLength : data.length;
        console.log(`[FishNet] Incoming packet (${size} bytes)`);
      }

      // Emit event for patches to intercept (pass raw data)
      if (window.MeowEngine?.Events?.OnEvent) {
        window.MeowEngine.Events.OnEvent.emit('data', {
          data: data,
          event: event,
          raw: true
        });
      }

      // Cache incoming packets if enabled (store raw data)
      if (MeowEngine.Config.cacheIncomingPhotonPackets) {
        const roomKey = FishNetSocketManager.getRoomKey();
        if (!MeowEngine.RoomInstance.CachedIncomingPackets[roomKey]) {
          MeowEngine.RoomInstance.CachedIncomingPackets[roomKey] = [];
        }
        MeowEngine.RoomInstance.CachedIncomingPackets[roomKey].push({
          timestamp: Date.now(),
          size: data instanceof ArrayBuffer ? data.byteLength : data.length,
          raw: true
        });
      }

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
