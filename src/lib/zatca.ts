/**
 * ZATCA QR Code (TLV format) generator
 * ZATCA Phase 1 QR contains TLV-encoded data in base64
 * Tags: 1=Seller, 2=VAT#, 3=Timestamp, 4=Total, 5=VAT Amount
 */

function tlvEncode(tag: number, value: string): Uint8Array {
  const encoded = new TextEncoder().encode(value);
  const result = new Uint8Array(2 + encoded.length);
  result[0] = tag;
  result[1] = encoded.length;
  result.set(encoded, 2);
  return result;
}

function concat(...arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

export interface ZatcaQrData {
  sellerName: string;
  vatNumber: string;
  timestamp: string; // ISO 8601
  totalAmount: string; // e.g. "1150.00"
  vatAmount: string;  // e.g. "150.00"
}

export function generateZatcaQrBase64(data: ZatcaQrData): string {
  const tlv = concat(
    tlvEncode(1, data.sellerName),
    tlvEncode(2, data.vatNumber),
    tlvEncode(3, data.timestamp),
    tlvEncode(4, data.totalAmount),
    tlvEncode(5, data.vatAmount)
  );
  return Buffer.from(tlv).toString("base64");
}

export function parseZatcaQr(base64: string): Partial<ZatcaQrData> {
  try {
    const buffer = Buffer.from(base64, "base64");
    const result: Partial<ZatcaQrData> = {};
    let offset = 0;

    while (offset < buffer.length) {
      const tag = buffer[offset++];
      const length = buffer[offset++];
      const value = buffer.slice(offset, offset + length).toString("utf8");
      offset += length;

      switch (tag) {
        case 1: result.sellerName = value; break;
        case 2: result.vatNumber = value; break;
        case 3: result.timestamp = value; break;
        case 4: result.totalAmount = value; break;
        case 5: result.vatAmount = value; break;
      }
    }
    return result;
  } catch {
    return {};
  }
}
