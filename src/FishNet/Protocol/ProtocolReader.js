/**
 * FishNet Protocol Reader
 * Handles deserialization of FishNet messages (both binary and JSON formats)
 */

export class ProtocolReader {
  constructor(data) {
    this.data = data;
    this.offset = 0;
    this.isJSON = false;
    this.parsedMessage = null;

    // Detect if data is JSON or binary
    if (typeof data === 'string') {
      try {
        this.parsedMessage = JSON.parse(data);
        this.isJSON = true;
      } catch (e) {
        console.error('Failed to parse JSON message:', e);
      }
    } else if (data instanceof ArrayBuffer) {
      this.view = new DataView(data);
      this.buffer = new Uint8Array(data);
    } else if (data instanceof Uint8Array) {
      this.buffer = data;
      this.view = new DataView(data.buffer);
    }
  }

  /**
   * Read message type (byte)
   */
  readMessageType() {
    if (this.isJSON) {
      return this.parsedMessage?.type ?? -1;
    }
    return this.readByte();
  }

  /**
   * Read timestamp (long)
   */
  readTimestamp() {
    if (this.isJSON) {
      return this.parsedMessage?.timestamp ?? Date.now();
    }
    return this.readLong();
  }

  /**
   * Read message data object
   */
  readData() {
    if (this.isJSON) {
      return this.parsedMessage?.data ?? {};
    }
    // For binary, read the data payload
    return this.readObject();
  }

  /**
   * Get the complete parsed message
   */
  getMessage() {
    if (this.isJSON) {
      return this.parsedMessage;
    }

    return {
      type: this.readMessageType(),
      timestamp: this.readTimestamp(),
      data: this.readData()
    };
  }

  // ==========================================
  // BINARY PRIMITIVE READERS
  // ==========================================

  /**
   * Read a single byte
   */
  readByte() {
    if (this.offset >= this.buffer.length) return 0;
    return this.buffer[this.offset++];
  }

  /**
   * Read a boolean
   */
  readBoolean() {
    return this.readByte() !== 0;
  }

  /**
   * Read a short (16-bit signed integer)
   */
  readShort() {
    const value = this.view.getInt16(this.offset, true); // little-endian
    this.offset += 2;
    return value;
  }

  /**
   * Read an integer (32-bit signed integer)
   */
  readInt() {
    const value = this.view.getInt32(this.offset, true); // little-endian
    this.offset += 4;
    return value;
  }

  /**
   * Read a long (64-bit signed integer) - returns as BigInt
   */
  readLong() {
    const value = this.view.getBigInt64(this.offset, true); // little-endian
    this.offset += 8;
    return Number(value); // Convert to number for compatibility
  }

  /**
   * Read a float (32-bit floating point)
   */
  readFloat() {
    const value = this.view.getFloat32(this.offset, true); // little-endian
    this.offset += 4;
    return value;
  }

  /**
   * Read a double (64-bit floating point)
   */
  readDouble() {
    const value = this.view.getFloat64(this.offset, true); // little-endian
    this.offset += 8;
    return value;
  }

  /**
   * Read a string
   */
  readString() {
    const length = this.readInt();
    if (length === 0) return '';

    const bytes = new Uint8Array(this.buffer.buffer, this.offset, length);
    this.offset += length;

    return new TextDecoder('utf-8').decode(bytes);
  }

  /**
   * Read a Vector3
   */
  readVector3() {
    return {
      x: this.readFloat(),
      y: this.readFloat(),
      z: this.readFloat()
    };
  }

  /**
   * Read a Quaternion
   */
  readQuaternion() {
    return {
      x: this.readFloat(),
      y: this.readFloat(),
      z: this.readFloat(),
      w: this.readFloat()
    };
  }

  /**
   * Read an array
   */
  readArray() {
    const length = this.readInt();
    const array = [];

    for (let i = 0; i < length; i++) {
      array.push(this.readObject());
    }

    return array;
  }

  /**
   * Read a generic object (attempts to deserialize based on type byte)
   */
  readObject() {
    const typeByte = this.readByte();

    switch (typeByte) {
      case 0: return null;
      case 1: return this.readBoolean();
      case 2: return this.readByte();
      case 3: return this.readShort();
      case 4: return this.readInt();
      case 5: return this.readLong();
      case 6: return this.readFloat();
      case 7: return this.readDouble();
      case 8: return this.readString();
      case 9: return this.readVector3();
      case 10: return this.readQuaternion();
      case 11: return this.readArray();
      case 12: return this.readDictionary();
      default:
        console.warn('Unknown type byte:', typeByte);
        return null;
    }
  }

  /**
   * Read a dictionary/map
   */
  readDictionary() {
    const count = this.readInt();
    const dict = {};

    for (let i = 0; i < count; i++) {
      const key = this.readString();
      const value = this.readObject();
      dict[key] = value;
    }

    return dict;
  }

  /**
   * Get remaining bytes in buffer
   */
  getRemainingBytes() {
    return this.buffer.length - this.offset;
  }

  /**
   * Check if there's more data to read
   */
  hasMoreData() {
    return this.offset < this.buffer.length;
  }
}

export default ProtocolReader;
