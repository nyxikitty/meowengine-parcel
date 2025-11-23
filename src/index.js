import MeowEngine from "./Browser/GlobalTypeDefs";
import UnityMessageWrapper from "./Browser/UnityInteraction/UnityMessageWrapper";
import CustomLogs from "./Browser/Utility/CustomLogs";
import GameUtils from "./Browser/Utility/GameUtils";
import FairCollection from "./Bullet Force/FairPlayAPI/FairCollection";
import CanvasConsole from "./Menu/CanvasComponents/CanvasConsole";
import PerformancePanel from "./Menu/CanvasComponents/PerformancePanel";
import PlayerListPanel from "./Menu/CanvasComponents/PlayerList";
import { UI } from "./Menu/UIManager"; // Assuming this is now the ModMenuUI class
import ConsoleFilter from "./MeowEngine/Patching/ConsoleFilter";
import Patching from "./MeowEngine/Patching/Entry";
import HttpRequestManager from "./Photon/HttpRequestManager";
import SocketManager from "./Photon/SocketManager";
// FishNet imports
import { FishNetSocketManager } from "./FishNet/FishNetSocketManager";
import { FishNetPatching } from "./FishNet/Patching/FishNetPatching";

// Return if not in the right iFrame
if (
  !window.location.href.includes(
    "https://bullet-force-multiplayer.game-files.crazygames.com/unity/unity2020/bullet-force-multiplayer.html"
  )
)
  return;

// Initialize Logs
MeowEngine.Log.Instance = new CustomLogs({
  title: "MeowEngine",
  enabled: true,
  showTimestamp: true,
});

// Wait for UnityInstance to be ready
GameUtils.waitForUnityInstance((instance) => {
  // Ensure MeowEngine is set to window globally
  window.MeowEngine = MeowEngine;

  MeowEngine.UnityInstance = instance;

  // set up GlobalTypeDefs
  MeowEngine.FairCollection.InitOperation = FairCollection.InitOperation;
  MeowEngine.FairCollection.Instance = FairCollection;

  // Override socket to add FishNet reading and writing logic
  // NOTE: Switched from Photon to FishNet networking
  FishNetSocketManager.overrideSocket();

  // Initialize the Http Request Manager
  HttpRequestManager.initialize();

  // Initialize network patches (FishNet version)
  FishNetPatching.initPatches();

  // Initialize UI
  // TODO: Remove the example UI elements and add a proper UI and features

  // Create the main container
  const newContainer = document.createElement("div");
  newContainer.id = `ui-container-${Date.now()}`;
  document.body.appendChild(newContainer);

  // Initialize UI
  const ui = new UI(newContainer.id);

  // Create a canvas to disable cursor events when the menu is shown
  const canvas = document.createElement("canvas");
  canvas.id = "overlayCanvas";
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  Object.assign(canvas.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100%",
    height: "100%",
    zIndex: "9999",
    backgroundColor: "transparent",
    opacity: "1",
    pointerEvents: "auto",
  });

  document.body.appendChild(canvas);

  function toggleCanvas() {
    if (canvas.style.opacity === "0") {
      canvas.style.opacity = "1";
      canvas.style.pointerEvents = "auto";
      ui.show();
    } else {
      canvas.style.opacity = "0";
      canvas.style.pointerEvents = "none";
      ui.hide();
    }
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "v") {
      toggleCanvas();
    }

    if (event.key === "f") {
      MeowEngine.Config.flyEnabled = !MeowEngine.Config.flyEnabled;
      if (MeowEngine.Config.flyEnabled) {
        UnityMessageWrapper.fly();
      } else {
        UnityMessageWrapper.unfly();
      }
    }
  });

  // Create tabs
  const tabs = [
    {
      label: "Home",
      content: createHomeTab(ui),
    },
    {
      label: "Settings",
      content: createSettingsTab(ui),
    },
    {
      label: "Packet Cache",
      content: createPacketCacheTab(ui),
    },
  ];

  ui.createTabs(tabs);

  // Function to create Home tab content
  function createHomeTab(ui) {
    const container = document.createElement("div");

    // Welcome Label
    container.appendChild(ui.createLabel("Welcome to MeowEngine v2.0"));
    container.appendChild(ui.createSpacer("20px"));

    // Sample Text Input
    const textInput = ui.createTextInput("Enter some text", (value) => {
      ui.createNotification(
        "Input Received",
        "info",
        `You entered: ${value}`,
        3000
      );
    });
    container.appendChild(ui.createLabel("Sample Input:"));
    container.appendChild(textInput);
    container.appendChild(ui.createSpacer());

    // Sample Button
    const actionButton = ui.createButton(
      "Click Me",
      () => {
        ui.createNotification(
          "Button Clicked",
          "info",
          "You clicked the button!",
          3000
        );
      },
      null,
      "Click to trigger a notification"
    );
    container.appendChild(actionButton);
    container.appendChild(ui.createSpacer());

    // Sample Divider
    container.appendChild(ui.createDivider());

    // Sample Color Picker
    const colorPicker = ui.createColorPicker(
      "Background Color",
      "#00ffaa",
      (color) => {
        ui.setBackground(color);
        ui.createNotification(
          "Color Changed",
          "info",
          `Background set to ${color}`,
          3000
        );
      }
    );
    container.appendChild(colorPicker);

    return container;
  }

  function createPacketCacheTab(ui) {
    const container = document.createElement("div");

    const incoming = () => MeowEngine.RoomInstance.CachedIncomingPackets || {};
    const outgoing = () => MeowEngine.RoomInstance.CachedOutgoingPackets || {};

    let roomOptions = [];
    let selectedRoom = "";
    let dropdownEl = null;

    function refreshRoomOptions() {
      const roomNames = new Set([
        ...Object.keys(incoming()),
        ...Object.keys(outgoing()),
      ]);

      const newRoomOptions = Array.from(roomNames).map((name) => ({
        value: name,
        label: name,
      }));

      const changed =
        newRoomOptions.length !== roomOptions.length ||
        newRoomOptions.some((opt, i) => opt.value !== roomOptions[i]?.value);

      if (changed) {
        roomOptions = newRoomOptions;

        if (!roomOptions.find((opt) => opt.value === selectedRoom)) {
          selectedRoom = roomOptions[0]?.value || "";
        }

        if (dropdownEl && dropdownEl.parentElement) {
          dropdownEl.parentElement.removeChild(dropdownEl);
        }

        dropdownEl = ui.createDropdown(
          roomOptions,
          selectedRoom,
          (value) => {
            selectedRoom = value;
            console.log(`Selected room: ${selectedRoom}`);
          },
          "Select Room"
        );

        container.insertBefore(dropdownEl, saveButton);
      }
    }

    const saveButton = ui.createButton("Save Room's Packet Cache", () => {
      if (!selectedRoom) {
        alert("No room selected!");
        return;
      }

      const incomingData = incoming()[selectedRoom] || [];
      const outgoingData = outgoing()[selectedRoom] || [];

      const combinedCache = {
        room: selectedRoom,
        incoming: incomingData,
        outgoing: outgoingData,
      };

      const blob = new Blob([JSON.stringify(combinedCache, null, 2)], {
        type: "application/json",
      });

      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `packet-cache-${selectedRoom}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    });

    dropdownEl = document.createElement("div");
    container.appendChild(dropdownEl);
    container.appendChild(ui.createSpacer());
    container.appendChild(saveButton);

    setInterval(refreshRoomOptions, 500);

    return container;
  }

  function createSettingsTab(ui) {
    const container = document.createElement("div");

    const playerListToggle = ui.createToggleSwitch(
      "Player List",
      true,
      (checked) => {
        MeowEngine.PlayerListCanvasComp.Instance.setVisible(checked);
      },
      "Toggle Player List"
    );

    container.appendChild(playerListToggle);
    container.appendChild(ui.createSpacer());

    const performanceStatsToggle = ui.createToggleSwitch(
      "Performance Stats Panel",
      true,
      (checked) => {
        MeowEngine.PerformancePanel.Instance.setVisible(checked);
      },
      "Toggle Performance Stats Panel"
    );

    container.appendChild(performanceStatsToggle);
    container.appendChild(ui.createSpacer());

    const eventCachineOToggle = ui.createToggleSwitch(
      "Cache outgoing photon packets",
      true,
      (checked) => {
        MeowEngine.Config.cacheOutgoingPhotonPackets = checked;
      },
      "Cache outgoing photon packets"
    );

    container.appendChild(eventCachineOToggle);
    container.appendChild(ui.createSpacer());

    const eventCachineIToggle = ui.createToggleSwitch(
      "Cache incoming photon packets",
      true,
      (checked) => {
        MeowEngine.Config.cacheIncomingPhotonPackets = checked;
      },
      "Cache outgoing photon packets"
    );

    container.appendChild(eventCachineIToggle);
    container.appendChild(ui.createSpacer());

    return container;
  }

  // Initialize canvas components if enabled
  if (MeowEngine.CanvasConsole.Enabled) {
    CanvasConsole.createConsole();
  }

  if (MeowEngine.PerformancePanel.Enabled) {
    const performancePanel = PerformancePanel.initialize();
    performancePanel.setVisible(MeowEngine.PerformancePanel.Enabled);
    performancePanel.setPosition("topRight");
    MeowEngine.PerformancePanel.Instance = performancePanel;
  }

  if (MeowEngine.PlayerListCanvasComp.Enabled) {
    const playerList = PlayerListPanel.initialize();
    playerList.setVisible(MeowEngine.PlayerListCanvasComp.Enabled);
    playerList.setPosition("topLeft");
    playerList.updateTitle("Active Players");
    MeowEngine.PlayerListCanvasComp.Instance = playerList;
  }

  // Store menu reference globally for debugging/external access
  window.MeowEngineMenu = menu;
  
  console.log("MeowEngine v2.0 initialized with ModMenu UI");
  console.log("Press 'V' or 'Insert' to toggle the menu");
});