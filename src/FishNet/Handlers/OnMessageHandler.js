import EventEmitter from "../../Browser/Utility/EventEmitter";

/**
 * FishNet OnMessage Event Handler
 * Handles incoming FishNet messages and emits events for processing
 */
export const OnMessage = new EventEmitter();

export class OnMessageHandler {
  static handleEvent(event) {
    OnMessage.emit("data", event);
  }
}

export default OnMessageHandler;
