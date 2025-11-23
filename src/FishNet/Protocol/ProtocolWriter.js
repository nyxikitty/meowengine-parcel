/**
 * FishNet Protocol Writer
 * Handles serialization of FishNet messages (both binary and JSON formats)
 */

export class ProtocolWriter {
  constructor(useJSON = true) {
    this.useJSON = useJSON;

    if (useJSON) {
      this.message = {
        type: -1,
        timestamp: Date.now(),
        data: {}
      };
    } else {
      // Binary mode - use dynamic array
      this.chunks = [];
      this.length = 0;
    }
  }

  /**
   * Set message type
   */
  setMessageType(type) {
    if (this.useJSON) {
      this.message.type = type;
    } else {
      this.writeByte(type);
    }
    return this;
  }

  /**
   * Set timestamp
   */
  setTimestamp(timestamp) {
    if (this.useJSON) {
      this.message.timestamp = timestamp;
    } else {
      this.writeLong(timestamp);
    }
    return this;
  }

  /**
   * Set message data
   */
  setData(data) {
    if (this.useJSON) {
      this.message.data = data;
    } else {
      this.writeObject(data);
    }
    return this;
  }

  /**
   * Add a field to message data
   */
  addField(key, value) {
    if (this.useJSON) {
      this.message.data[key] = value;
    } else {
      // For binary, write key-value pair
      this.writeString(key);
      this.writeObject(value);
    }
    return this;
  }

  /**
   * Convert to sendable format
   */
  toBuffer() {
    if (this.useJSON) {
      return JSON.stringify(this.message);
    } else {
      // Combine all chunks into a single ArrayBuffer
      const buffer = new Uint8Array(this.length);
      let offset = 0;

      for (const chunk of this.chunks) {
        buffer.set(chunk, offset);
        offset += chunk.length;
      }

      return buffer.buffer;
    }
  }

  // ==========================================
  // BINARY PRIMITIVE WRITERS
  // ==========================================

  /**
   * Add a chunk to the buffer
   */
  addChunk(chunk) {
    this.chunks.push(chunk);
    this.length += chunk.length;
  }

  /**
   * Write a single byte
   */
  writeByte(value) {
    this.addChunk(new Uint8Array([value]));
    return this;
  }

  /**
   * Write a boolean
   */
  writeBoolean(value) {
    return this.writeByte(value ? 1 : 0);
  }

  /**
   * Write a short (16-bit signed integer)
   */
  writeShort(value) {
    const buffer = new ArrayBuffer(2);
    const view = new DataView(buffer);
    view.setInt16(0, value, true); // little-endian
    this.addChunk(new Uint8Array(buffer));
    return this;
  }

  /**
   * Write an integer (32-bit signed integer)
   */
  writeInt(value) {
    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    view.setInt32(0, value, true); // little-endian
    this.addChunk(new Uint8Array(buffer));
    return this;
  }

  /**
   * Write a long (64-bit signed integer)
   */
  writeLong(value) {
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);
    view.setBigInt64(0, BigInt(value), true); // little-endian
    this.addChunk(new Uint8Array(buffer));
    return this;
  }

  /**
   * Write a float (32-bit floating point)
   */
  writeFloat(value) {
    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    view.setFloat32(0, value, true); // little-endian
    this.addChunk(new Uint8Array(buffer));
    return this;
  }

  /**
   * Write a double (64-bit floating point)
   */
  writeDouble(value) {
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);
    view.setFloat64(0, value, true); // little-endian
    this.addChunk(new Uint8Array(buffer));
    return this;
  }

  /**
   * Write a string
   */
  writeString(value) {
    if (!value) {
      this.writeInt(0);
      return this;
    }

    const encoded = new TextEncoder().encode(value);
    this.writeInt(encoded.length);
    this.addChunk(encoded);
    return this;
  }

  /**
   * Write a Vector3
   */
  writeVector3(value) {
    this.writeFloat(value.x);
    this.writeFloat(value.y);
    this.writeFloat(value.z);
    return this;
  }

  /**
   * Write a Quaternion
   */
  writeQuaternion(value) {
    this.writeFloat(value.x);
    this.writeFloat(value.y);
    this.writeFloat(value.z);
    this.writeFloat(value.w);
    return this;
  }

  /**
   * Write an array
   */
  writeArray(array) {
    this.writeInt(array.length);

    for (const item of array) {
      this.writeObject(item);
    }

    return this;
  }

  /**
   * Write a generic object (with type byte)
   */
  writeObject(value) {
    if (value === null || value === undefined) {
      this.writeByte(0);
    } else if (typeof value === 'boolean') {
      this.writeByte(1);
      this.writeBoolean(value);
    } else if (typeof value === 'number') {
      if (Number.isInteger(value)) {
        if (value >= -128 && value <= 127) {
          this.writeByte(2);
          this.writeByte(value);
        } else if (value >= -32768 && value <= 32767) {
          this.writeByte(3);
          this.writeShort(value);
        } else {
          this.writeByte(4);
          this.writeInt(value);
        }
      } else {
        this.writeByte(6);
        this.writeFloat(value);
      }
    } else if (typeof value === 'string') {
      this.writeByte(8);
      this.writeString(value);
    } else if (Array.isArray(value)) {
      this.writeByte(11);
      this.writeArray(value);
    } else if (typeof value === 'object') {
      // Check for special types
      if (value.x !== undefined && value.y !== undefined && value.z !== undefined && value.w === undefined) {
        this.writeByte(9);
        this.writeVector3(value);
      } else if (value.x !== undefined && value.y !== undefined && value.z !== undefined && value.w !== undefined) {
        this.writeByte(10);
        this.writeQuaternion(value);
      } else {
        this.writeByte(12);
        this.writeDictionary(value);
      }
    }

    return this;
  }

  /**
   * Write a dictionary/map
   */
  writeDictionary(dict) {
    const keys = Object.keys(dict);
    this.writeInt(keys.length);

    for (const key of keys) {
      this.writeString(key);
      this.writeObject(dict[key]);
    }

    return this;
  }
}

export default ProtocolWriter;
