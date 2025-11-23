import EventEmitter from "../../Browser/Utility/EventEmitter";
import { ProtocolReader } from "../Protocol/ProtocolReader";

/**
 * FishNet SendMessage Event Handler
 * Handles outgoing FishNet messages and emits events for processing
 */
export const SendMessage = new EventEmitter();

export class SendMessageHandler {
  static handleEvent(socket, originalSend, args) {
    const message = args[0];

    // Parse the message
    const reader = new ProtocolReader(message);
    const parsedMessage = reader.getMessage();

    SendMessage.emit("data", {
      args,
      data: parsedMessage,
      socket,
      originalSend
    });
  }
}

export default SendMessageHandler;
