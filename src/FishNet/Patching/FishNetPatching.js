import MeowEngine from "../../Browser/GlobalTypeDefs";
import GameUtils from "../../Browser/Utility/GameUtils";
import { MessageType } from "../Enums/MessageType";
import { SendMessage } from "../Handlers/SendMessageHandler";
import { OnMessage } from "../Handlers/OnMessageHandler";
import { ProtocolReader } from "../Protocol/ProtocolReader";
import { ProtocolWriter } from "../Protocol/ProtocolWriter";

/**
 * FishNet Patching System
 * Intercepts and modifies FishNet messages for modding purposes
 */
export class FishNetPatching {
  static initPatches() {
    // Initialize event emitters in global scope
    if (!window.MeowEngine) {
      window.MeowEngine = MeowEngine;
    }
    window.MeowEngine.Events = window.MeowEngine.Events || {};
    window.MeowEngine.Events.SendMessage = SendMessage;
    window.MeowEngine.Events.OnMessage = OnMessage;

    console.log('[FishNet] Initializing patches...');

    // ========================================
    // OUTGOING MESSAGE PATCHES
    // ========================================
    SendMessage.addListener("data", async ({ args, data, socket, originalSend }) => {
      try {
        const message = data;

        if (MeowEngine.Config.debugOutgoingPackets) {
          console.log('[FishNet] Outgoing message:', message);
        }

        // Cache outgoing messages if enabled
        if (MeowEngine.Config.cacheOutgoingPhotonPackets) {
          const roomKey = FishNetPatching.getRoomKey();
          if (!MeowEngine.RoomInstance.CachedOutgoingPackets[roomKey]) {
            MeowEngine.RoomInstance.CachedOutgoingPackets[roomKey] = [];
          }
          MeowEngine.RoomInstance.CachedOutgoingPackets[roomKey].push(message);
        }

        // Handle authentication message
        if (message.type === MessageType.AUTHENTICATE) {
          console.log('[FishNet] Authentication message detected');
          // Store server settings from authentication
          if (message.data) {
            const serverSettings = MeowEngine.SDK.FishNetServerSettings;
            if (message.data.region) serverSettings.Region = message.data.region;
            if (message.data.version) serverSettings.AppVersion = message.data.version;
          }
        }

        // Handle RPC messages (similar to OpRaiseEvent)
        if (message.type === MessageType.RPC_RELIABLE || message.type === MessageType.RPC_UNRELIABLE) {
          const modified = FishNetPatching.handleOutgoingRPC(message, socket, originalSend, args);
          if (modified) {
            return; // Message was modified and sent, don't send original
          }
        }

        // Handle transform sync messages
        if (message.type === MessageType.TRANSFORM_SYNC) {
          // Update local player position if this is their transform
          if (message.data.objectId === MeowEngine.LocalPlayer.ObjectId) {
            if (message.data.position) {
              MeowEngine.LocalPlayer.Position = message.data.position;
            }
            if (message.data.rotation) {
              MeowEngine.LocalPlayer.Rotation = message.data.rotation;
            }
          }
        }

        // Send original message
        return originalSend.apply(socket, args);
      } catch (error) {
        console.error('[FishNet] Error in outgoing message patch:', error);
        return originalSend.apply(socket, args);
      }
    });

    // ========================================
    // INCOMING MESSAGE PATCHES
    // ========================================
    OnMessage.addListener("data", (event) => {
      try {
        if (!event.data) return;

        // Parse incoming message
        const reader = new ProtocolReader(event.data);
        const message = reader.getMessage();

        if (MeowEngine.Config.debugIncomingPackets) {
          console.log('[FishNet] Incoming message:', message);
        }

        // Cache incoming messages if enabled
        if (MeowEngine.Config.cacheIncomingPhotonPackets) {
          const roomKey = FishNetPatching.getRoomKey();
          if (!MeowEngine.RoomInstance.CachedIncomingPackets[roomKey]) {
            MeowEngine.RoomInstance.CachedIncomingPackets[roomKey] = [];
          }
          MeowEngine.RoomInstance.CachedIncomingPackets[roomKey].push(message);
        }

        // Handle specific message types
        FishNetPatching.handleIncomingMessage(message);
      } catch (error) {
        console.error('[FishNet] Error in incoming message patch:', error);
      }
    });

    console.log('[FishNet] Patches initialized successfully');
  }

  /**
   * Handle outgoing RPC messages
   */
  static handleOutgoingRPC(message, socket, originalSend, args) {
    const { methodName, parameters } = message.data;

    // Handle player spawn RPC (similar to Photon code 252)
    if (methodName === 'SpawnPlayer' || methodName === 'Event_252') {
      console.log('[FishNet] Intercepting player spawn RPC');

      // Modify platform if spoofing is enabled
      if (MeowEngine.LocalPlayer.SpoofPlatform && parameters.platform) {
        parameters.platform = MeowEngine.LocalPlayer.Platform;
      }

      // Modify player name with clan tag
      if (parameters.playerName && MeowEngine.LocalPlayer.ClanTag) {
        parameters.playerName = `[${MeowEngine.LocalPlayer.ClanTag}] ${parameters.playerName}`;
      }

      // Send modified message
      const writer = new ProtocolWriter(true);
      writer.setMessageType(message.type);
      writer.setTimestamp(message.timestamp);
      writer.setData(message.data);

      const buffer = writer.toBuffer();
      const newArgs = [buffer];
      originalSend.apply(socket, newArgs);
      return true;
    }

    // Handle player data update RPC (similar to Photon code 226)
    if (methodName === 'UpdatePlayerData' || methodName === 'Event_226') {
      console.log('[FishNet] Intercepting player data update RPC');

      // Apply spoofing settings
      if (MeowEngine.LocalPlayer.SpoofRank && parameters.rank !== undefined) {
        parameters.rank = MeowEngine.LocalPlayer.Rank;
      }

      if (MeowEngine.LocalPlayer.SpoofTeamNumber && parameters.team !== undefined) {
        parameters.team = MeowEngine.LocalPlayer.TeamNumber;
      }

      if (MeowEngine.LocalPlayer.SpoofThrowableAmount && parameters.throwable_amount !== undefined) {
        parameters.throwable_amount = MeowEngine.LocalPlayer.ThrowableAmount;
      }

      // Add clan tag to name
      if (parameters.playerName && MeowEngine.LocalPlayer.ClanTag) {
        parameters.playerName = `[${MeowEngine.LocalPlayer.ClanTag}] ${parameters.playerName}`;
      }

      // Send modified message
      const writer = new ProtocolWriter(true);
      writer.setMessageType(message.type);
      writer.setTimestamp(message.timestamp);
      writer.setData(message.data);

      const buffer = writer.toBuffer();
      const newArgs = [buffer];
      originalSend.apply(socket, newArgs);
      return true;
    }

    return false; // Message not modified
  }

  /**
   * Handle incoming messages
   */
  static handleIncomingMessage(message) {
    const { type, data } = message;

    switch (type) {
      case MessageType.CONNECTION_APPROVED:
        console.log('[FishNet] Connection approved');
        break;

      case MessageType.SPAWN_OBJECT:
        FishNetPatching.handleObjectSpawn(data);
        break;

      case MessageType.DESPAWN_OBJECT:
        FishNetPatching.handleObjectDespawn(data);
        break;

      case MessageType.RPC_RELIABLE:
      case MessageType.RPC_UNRELIABLE:
        FishNetPatching.handleIncomingRPC(data);
        break;

      case MessageType.SYNC_VAR:
        FishNetPatching.handleSyncVar(data);
        break;

      case MessageType.TRANSFORM_SYNC:
        FishNetPatching.handleTransformSync(data);
        break;
    }
  }

  /**
   * Handle object spawn
   */
  static handleObjectSpawn(data) {
    const { objectId, ownerId, prefabId } = data;

    // If this is a player object, add to player list
    if (prefabId === 'Player' || prefabId === 'PlayerPrefab') {
      console.log('[FishNet] Player object spawned:', objectId, 'Owner:', ownerId);

      if (!MeowEngine.RoomInstance.Players[ownerId]) {
        MeowEngine.RoomInstance.Players[ownerId] = {
          actorNr: ownerId,
          objectId: objectId,
          name: 'Unknown',
          rank: 0,
          kd: 0,
          team: 0,
          kills: 0,
          platform: 'Unknown',
          position: data.position || { x: 0, y: 0, z: 0 },
          rotation: data.rotation || { x: 0, y: 0, z: 0, w: 1 },
          pitch: 0,
          yaw: 0,
          health: 100,
          ping: 0
        };
      }
    }
  }

  /**
   * Handle object despawn
   */
  static handleObjectDespawn(data) {
    const { objectId } = data;
    console.log('[FishNet] Object despawned:', objectId);

    // Remove player if this was their object
    for (const [playerId, player] of Object.entries(MeowEngine.RoomInstance.Players)) {
      if (player.objectId === objectId) {
        delete MeowEngine.RoomInstance.Players[playerId];
        console.log('[FishNet] Player removed:', playerId);
        break;
      }
    }
  }

  /**
   * Handle incoming RPC
   */
  static handleIncomingRPC(data) {
    const { methodName, parameters, senderId } = data;

    // Handle player join RPC
    if (methodName === 'PlayerJoined' || methodName === 'Event_255') {
      console.log('[FishNet] Player joined:', senderId);

      if (!MeowEngine.RoomInstance.Players[senderId]) {
        MeowEngine.RoomInstance.Players[senderId] = {
          actorNr: senderId,
          name: parameters.playerName || 'Unknown',
          rank: parameters.rank || 0,
          kd: parameters.kd || 0,
          team: parameters.team || 0,
          kills: 0,
          platform: parameters.platform || 'Unknown',
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
          pitch: 0,
          yaw: 0,
          health: 100,
          ping: 0
        };
      }
    }

    // Handle player left RPC
    if (methodName === 'PlayerLeft' || methodName === 'Event_254') {
      console.log('[FishNet] Player left:', senderId);
      delete MeowEngine.RoomInstance.Players[senderId];
    }

    // Handle player update RPC (similar to Photon OpCode 201)
    if (methodName === 'UpdatePlayerState' || methodName === 'Event_201') {
      FishNetPatching.handlePlayerStateUpdate(senderId, parameters);
    }
  }

  /**
   * Handle player state update
   */
  static handlePlayerStateUpdate(playerId, data) {
    if (!MeowEngine.RoomInstance.Players[playerId]) {
      MeowEngine.RoomInstance.Players[playerId] = {
        actorNr: playerId,
        name: 'Unknown',
        rank: 0,
        kd: 0,
        team: 0,
        kills: 0,
        platform: 'Unknown',
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        pitch: 0,
        yaw: 0,
        health: 100,
        ping: 0
      };
    }

    const player = MeowEngine.RoomInstance.Players[playerId];

    // Update player data
    if (data.position) player.position = data.position;
    if (data.rotation) player.rotation = data.rotation;
    if (data.health !== undefined) player.health = data.health;
    if (data.kills !== undefined) player.kills = data.kills;
    if (data.pitch !== undefined) player.pitch = data.pitch;
    if (data.yaw !== undefined) player.yaw = data.yaw;
    if (data.ping !== undefined) player.ping = data.ping;
  }

  /**
   * Handle sync var update
   */
  static handleSyncVar(data) {
    const { objectId, varName, value } = data;

    // Find player by object ID
    for (const [playerId, player] of Object.entries(MeowEngine.RoomInstance.Players)) {
      if (player.objectId === objectId) {
        // Update player property
        if (varName === 'health') player.health = value;
        if (varName === 'kills') player.kills = value;
        if (varName === 'deaths') player.deaths = value;
        if (varName === 'team') player.team = value;
        break;
      }
    }
  }

  /**
   * Handle transform synchronization
   */
  static handleTransformSync(data) {
    const { objectId, position, rotation, velocity } = data;

    // Find player by object ID
    for (const [playerId, player] of Object.entries(MeowEngine.RoomInstance.Players)) {
      if (player.objectId === objectId) {
        if (position) player.position = position;
        if (rotation) player.rotation = rotation;
        if (velocity) player.velocity = velocity;
        break;
      }
    }
  }

  /**
   * Get room key for caching
   */
  static getRoomKey() {
    const roomName = MeowEngine.RoomInstance?.Information?.RoomName || 'Unknown';
    const roomId = MeowEngine.RoomInstance?.Information?.RoomId || 'Unknown';
    return `${roomName} ${roomId}`;
  }
}

export default FishNetPatching;
