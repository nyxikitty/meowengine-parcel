# MeowEngine Parcel

## ✅ FishNet Migration Complete
### This project has been successfully migrated from Photon Networking to FishNet Unity Networking to ensure compatibility with the latest Bullet Force update. The mod base now fully supports FishNet protocol.

## Table of Contents
- [Disclaimer](#disclaimer)
- [Overview](#overview)
- [Features](#features)
- [SDK](#sdk)
- [Network Patches](#network-patches)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Development](#development)
- [Making Your Own Mod](#making-your-own-mod)
- [Player Management System](#player-management-system)
- [Contributing](#contributing)
- [License](#license)

A high-performance Bullet Force Cheat Engine rebuilt with Parcel bundler for optimized performance and enhanced code organization.

## ⚠️ Disclaimer: This project is intended for educational and personal use only.

- This custom mod base was created for a Unity Web game and is **not** designed to promote or enable the creation of malicious cheats or exploits.
 
## Overview

MeowEngine Parcel has been completely redesigned using Parcel bundler to deliver better performance, cleaner architecture, and improved maintainability. This implementation features optimized code organization and structural improvements to facilitate ongoing development.

![image](https://github.com/user-attachments/assets/f0ef4212-b009-4ccd-bb26-5892f643c023)
![image](https://github.com/user-attachments/assets/6b00b4a2-2f1c-4222-b75d-7159265919e3)
![Preview Video](https://github.com/user-attachments/assets/f7cf4f5f-96ba-4e07-9ac2-08db375e9bac)

## Features:

- **High Performance**: Rebuilt with Parcel for faster execution and efficient bundling
- **Clean Architecture**: Improved code structure and organization
- **Enhanced Maintainability**: Better organized components for easier future development
- **User Script Ready**: Compiles directly to a userscript format for quick installation

## SDK

MeowEngine includes a custom SDK for networking functionality. The project has been migrated from Photon to FishNet Unity Networking:

### FishNet Implementation
- **Protocol Support**: JSON and binary message formats
- **Message Types**: Connection management, authentication, RPC calls, object spawning, transform sync
- **Network Communication**: WebSocket connections to FishNet servers
- **Cryptography Layer**: Encryption/decryption methods for game data (integers, strings, vectors, etc.)
- **Configuration Options**: Debug mode flags and development settings
- **API Compatibility**: Maintains backward compatibility with Photon-style networking patterns

### Legacy Photon Support
The original Photon networking code is preserved in the `/src/Photon` directory for reference, but the active implementation now uses FishNet (`/src/FishNet`).

![image](https://github.com/user-attachments/assets/51f54ed4-5392-4802-9a7c-da952a107cb5)

## Network Patches

### FishNet Patches
- **Location**: `/src/FishNet/Patching/FishNetPatching.js`
- **Incoming Messages**: Intercepts and processes FishNet messages (RPC calls, object spawns, transform sync, etc.)
- **Outgoing Messages**: Modifies outgoing messages for spoofing player data, platform, rank, etc.
- **Player Management**: Tracks player state, positions, and statistics in real-time

### Legacy Photon Patches
- **Location**: `/src/MeowEngine/Patching/Entry.js` (preserved for reference)
- The original Photon implementation has been replaced with FishNet

## Project Structure

```
meowengine-parcel/
├── dist/ # Built files
│   ├── index.js # Main entry point
│   └── meowengine.user.js
├── lib/
│   └── tree.js
├── node_modules/
├── src/
│   ├── Browser/
│   │   ├── UnityInteraction/
│   │   │   └── UnityMessageWrapper.ts
│   │   ├── Utility/
│   │   │   ├── Buffer.ts
│   │   │   ├── CustomLogs.ts
│   │   │   ├── EventEmitter.ts
│   │   │   └── GameUtils.ts
│   │   └── GlobalTypeDefs.ts
│   ├── FishNet/                      # NEW: FishNet networking implementation
│   │   ├── Enums/
│   │   │   ├── MessageType.js
│   │   │   ├── Channel.js
│   │   │   └── Target.js
│   │   ├── Protocol/
│   │   │   ├── ProtocolReader.js
│   │   │   └── ProtocolWriter.js
│   │   ├── Handlers/
│   │   │   ├── OnMessageHandler.js
│   │   │   └── SendMessageHandler.js
│   │   ├── Patching/
│   │   │   └── FishNetPatching.js
│   │   ├── FishNetClient.js
│   │   └── FishNetSocketManager.js
│   ├── Bullet Force/
│   │   ├── API/
│   │   │   ├── Account.ts
│   │   │   └── RegistrationData.ts
│   │   └── FairPlayAPI/
│   │       └── FairCollection.ts
│   ├── Menu/
│   │   ├── CanvasComponents/
│   │   │   ├── CanvasConsole.ts
│   │   │   ├── PerformancePanel.ts
│   │   │   └── PlayerList.ts
│   │   ├── Components/ # UI components
│   │   │   ├── 3DViewPort.js
│   │   │   ├── Button.js
│   │   │   ├── ButtonGroup.js
│   │   │   ├── ColorPicker.js
│   │   │   ├── ConfirmModal.js
│   │   │   ├── Console.js
│   │   │   ├── Container.js
│   │   │   ├── ContentArea.js
│   │   │   ├── Devider.js
│   │   │   ├── Dropdown.js
│   │   │   ├── DynamicListBox.js
│   │   │   ├── GameConsole.js
│   │   │   ├── Header.js
│   │   │   ├── Label.js
│   │   │   ├── Notification.js
│   │   │   ├── PanelContainer.js
│   │   │   ├── SideNav.js
│   │   │   ├── Slider.js
│   │   │   ├── Spacer.js
│   │   │   ├── Tab.js
│   │   │   ├── TextInput.js
│   │   │   ├── ToggleGroup.js
│   │   │   └── ToggleSwitch.js
│   │   ├── Examples.md
│   │   └── UIManager.ts
│   ├── MeowEngine/
│   │   ├── Bot/
│   │   │   └── FishNetBot.js
│   │   ├── Patching/
│   │   │   ├── ConsoleFilter.ts
│   │   │   └── Entry.js # Patch listeners (Add your own patches here)
│   │   └── Photon/
│   │       ├── Instance/
│   │       │   └── GameSocket.js
│   │       └── protocol_reader/
│   │           ├── Old/
│   │           │   ├── OldPacket.js
│   │           │   ├── OldReader.js
│   │           │   └── OldWriter.js
│   │           ├── types/
│   │           │   ├── Array.js
│   │           │   ├── CustomData.js
│   │           │   ├── CustomDataReader.js
│   │           │   ├── packets.js
│   │           │   ├── Quaternion.js
│   │           │   ├── Serializable.js
│   │           │   ├── SizedFloat.js
│   │           │   ├── SizedInt.js
│   │           │   ├── UnimplementedCustomData.js
│   │           │   └── Vector3.js
│   │           ├── constants.js
│   │           ├── PacketBuilder.js
│   │           ├── ProtocolReader.js
│   │           └── ProtocolWriter.js
│   ├── Patches/
│   │   ├── OnEvent.js
│   │   └── OpRaiseEvent.js
│   ├── Photon/
│   │   ├── Enums/
│   │   │   ├── DataType.js
│   │   │   ├── EventCaching.js
│   │   │   ├── EventCode.js
│   │   │   ├── InternalOperationCode.js
│   │   │   ├── OperationCode.js
│   │   │   ├── PacketType.js
│   │   │   ├── ParameterCode.js
│   │   │   └── ReceiverGroup.js
│   │   ├── Handlers/
│   │   │   ├── OnEventHandler.js
│   │   │   ├── OpCode201.js
│   │   │   ├── OpRaiseEventHandler.js
│   │   │   └── PlayerList.js
│   │   ├── StaticDefinitions/
│   │   │   ├── RaiseEventOptions.js
│   │   │   └── SendOptions.js
│   │   ├── Utils/ # Utility functions
│   │   │   ├── Deserializer.js
│   │   │   ├── Packet.js
│   │   │   ├── PacketBuilder.js
│   │   │   └── Serializer.js
│   │   ├── HttpRequestManager.js
│   │   ├── PhotonClient.js
│   │   └── SocketManager.js
│   └── index.js # Main entry point
├── .parcelrc # Parcel configuration
├── bundle.js
├── header.js
├── old.user.js
├── package.json # Project dependencies and scripts
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
└── README.md
```

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- [pnpm](https://pnpm.io/) package manager

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/cyberarchives/meowengine-parcel.git
   cd meowengine-parcel
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

## Development

### Building

To build the project:

```bash
pnpm build
```

After building, check `dist/meowengine.user.js` for the built script that can be installed in userscript managers like Tampermonkey or Greasemonkey.

### Development Mode

To run in development mode with hot reloading:

```bash
pnpm dev
```

## Making Your Own Mod

### Key Files

- The main entry file is located at `/src/index.js`. This is where you can add or modify UI elements and core functionality.
- UI components can be found in the `/src/components/` directory.

### Getting Started with Modding

1. Begin by exploring `/src/index.js` which serves as the application's entry point.
2. To create new UI elements:
   - Look at [Examples.md](https://github.com/cyberarchives/meowengine-parcel/blob/main/src/Menu/Examples.md)

3. Modify existing features by editing the corresponding files in the core directory.

# Player Management System

## Overview
The MeowEngine includes a robust player management system that provides access to detailed player information across your game environment. This functionality is crucial for implementing multiplayer features, leaderboards, and player interactions.

## Accessing Players

You can retrieve all players in the current room instance using the following method:

```javascript
function GetPlayers() {
   return MeowEngine.RoomInstance.Players;
}

const players = GetPlayers();
```

## Player Object Structure

Each player is represented by an object containing the following properties:

| Property | Type | Description |
|----------|------|-------------|
| `actorNr` | Integer | Unique player identifier within the room |
| `name` | String | Player's display name |
| `rank` | Integer | Player's current ranking |
| `kd` | Float | Player's kill/death ratio |
| `team` | Integer | Team identifier (0, 1, etc.) |
| `kills` | Integer | Current kill count |
| `platform` | String | Platform identifier (e.g., "WebGLPlayer") |
| `position` | Object | Player's current position coordinates |
| `rotation` | Object | Player's current rotation values |
| `pitch` | Float | Player's current pitch angle |
| `yaw` | Float | Player's current yaw angle |
| `health` | Integer | Player's current health value |
| `ping` | Integer | Player's connection latency in ms |

## Example Output

```javascript
[
    { // Not sure why the game does this, it sends you an empty player packet
        "13": {
            "actorNr": 13,
            "name": "",
            "rank": 0,
            "kd": 0,
            "team": 0,
            "kills": 0,
            "platform": "Unknown",
            "position": {
                "x": -17.88554573059082,
                "y": 1.6934276819229126,
                "z": 6.833706855773926
            },
            "rotation": {
                "w": 1,
                "x": 0,
                "y": 0,
                "z": 0
            },
            "pitch": 2950,
            "yaw": 3970,
            "health": 2264,
            "ping": 105
        }
    },
    {
        "11": {
            "actorNr": 11,
            "name": "PC-Fredrickbrown",
            "rank": 16,
            "kd": 0.6425120830535889,
            "team": 1,
            "kills": 0,
            "platform": "WebGLPlayer",
            "position": {
                "x": -42.128578186035156,
                "y": 5.438340663909912,
                "z": 24.576688766479492
            },
            "rotation": {
                "w": 1,
                "x": 0,
                "y": 0,
                "z": 0
            },
            "pitch": 1530,
            "yaw": 3224,
            "health": 10000,
            "ping": 204
        }
    },
    {
        "9": {
            "actorNr": 9,
            "name": "PC-chucky4",
            "rank": 35,
            "kd": 0.9057227969169617,
            "team": 1,
            "kills": 0,
            "platform": "WebGLPlayer",
            "position": {
                "x": -50.776187896728516,
                "y": 5.189589500427246,
                "z": -6.514407634735107
            },
            "rotation": {
                "w": 1,
                "x": 0,
                "y": 0,
                "z": 0
            },
            "pitch": 290,
            "yaw": -280,
            "health": null,
            "ping": 59
        }
    },
    {
        "8": {
            "actorNr": 8,
            "name": "PC-Nzeru",
            "rank": 16,
            "kd": 0.5938931107521057,
            "team": 0,
            "kills": 1,
            "platform": "WebGLPlayer",
            "position": {
                "x": -8.04712963104248,
                "y": 5.137051582336426,
                "z": 33.926910400390625
            },
            "rotation": {
                "w": 1,
                "x": 0,
                "y": 0,
                "z": 0
            },
            "pitch": 1550,
            "yaw": 255,
            "health": 10000,
            "ping": 62
        }
    },
    {
        "6": {
            "actorNr": 6,
            "name": "PC-eTurducken",
            "rank": 2,
            "kd": 0.4545454680919647,
            "team": 0,
            "kills": 0,
            "platform": "WebGLPlayer",
            "position": {
                "x": -62.402469635009766,
                "y": 5.1363139152526855,
                "z": 10.234478950500488
            },
            "rotation": {
                "w": 1,
                "x": 0,
                "y": 0,
                "z": 0
            },
            "pitch": 880,
            "yaw": 19,
            "health": 10000,
            "ping": 43
        }
    },
    {
        "4": {
            "actorNr": 4,
            "name": "PC-juicyshart",
            "rank": 9,
            "kd": 1.0656565427780151,
            "team": 0,
            "kills": 0,
            "platform": "WebGLPlayer",
            "position": {
                "x": -50.3499641418457,
                "y": 6.5234503746032715,
                "z": -13.241415023803711
            },
            "rotation": {
                "w": 1,
                "x": 0,
                "y": 0,
                "z": 0
            },
            "pitch": 1320,
            "yaw": -335,
            "health": 4427,
            "ping": 46
        }
    },
    {
        "3": {
            "actorNr": 3,
            "name": "PC-xxxxderrius",
            "rank": 1,
            "kd": 0,
            "team": 1,
            "kills": 0,
            "platform": "WebGLPlayer",
            "position": {
                "x": -18.738447189331055,
                "y": 1.6934278011322021,
                "z": 8.207507133483887
            },
            "rotation": {
                "w": 1,
                "x": 0,
                "y": 0,
                "z": 0
            },
            "pitch": 1200,
            "yaw": 2603,
            "health": null,
            "ping": 61
        }
    },
    {
        "1": {
            "actorNr": 1,
            "name": "PC-trauancoleman",
            "rank": 19,
            "kd": 0.17782217264175415,
            "team": 0,
            "kills": 0,
            "platform": "WebGLPlayer",
            "position": {
                "x": -8.79213809967041,
                "y": 5.137052059173584,
                "z": 35.69183349609375
            },
            "rotation": {
                "w": 1,
                "x": 0,
                "y": 0,
                "z": 0
            },
            "pitch": 2810,
            "yaw": 2965,
            "health": null,
            "ping": 105
        }
    },
    { // Not sure why the game does this, it sends you an empty player packet
        "14": {
            "actorNr": 14,
            "name": "",
            "rank": 0,
            "kd": 0,
            "team": 0,
            "kills": 0,
            "platform": "Unknown",
            "position": {},
            "rotation": {},
            "pitch": 0,
            "yaw": 0,
            "health": 0,
            "ping": 0
        }
    },
    {
        "15": {
            "actorNr": 15,
            "name": "PC-Leonardo128",
            "rank": 1,
            "kd": 0.5909090638160706,
            "team": 0,
            "kills": 0,
            "platform": "WebGLPlayer",
            "position": {
                "x": -40.76292419433594,
                "y": 6.83626651763916,
                "z": -27.654510498046875
            },
            "rotation": {
                "w": 1,
                "x": 0,
                "y": 0,
                "z": 0
            },
            "pitch": 3100,
            "yaw": 3606,
            "health": 10000,
            "ping": 226
        }
    }
]
```

## Common Use Cases

- **Team Assignment**: Filter players by their `team` property
- **Leaderboards**: Sort players based on `rank` or `kd` ratio
- **Proximity Features**: Calculate distances between players using `position` data

### Best Practices

- Keep UI components separate from core functionality
- Use the existing SDK for network-related operations
- Test thoroughly in development mode before building
- Consider adding comments to document your modifications

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
