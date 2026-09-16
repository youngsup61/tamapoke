// pak_loader.js - TPAK archive & TPK2 PMD sprite parser for TamaPoke
// Reads /web/sprites.pak (41MB) using Range requests or full fetch with IndexedDB cache

class PakLoader {
  constructor() {
    this.pakUrl = './sprites.pak';
    this.index = new Map(); // filename -> { offset, size }
    this.buffer = null;
    this.monCache = new Map(); // "p001" or "ps001" -> parsed sprite data
    this.ready = false;
    this.onProgress = null;
  }

  async init(progressCallback) {
    this.onProgress = progressCallback;
    try {
      // 1. Try to fetch the pak bundle
      if (this.onProgress) this.onProgress(0.05, "스프라이트 팩 연결 중...");
      const response = await fetch(this.pakUrl);
      if (!response.ok) {
        console.warn("Could not fetch local sprites.pak directly:", response.status);
        return false;
      }
      
      const contentLength = response.headers.get('content-length');
      const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;
      
      const reader = response.body.getReader();
      let receivedBytes = 0;
      const chunks = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        receivedBytes += value.length;
        if (totalBytes > 0 && this.onProgress) {
          const ratio = Math.min(0.95, receivedBytes / totalBytes);
          this.onProgress(ratio, `스프라이트 다운로드 중... (${(receivedBytes / 1048576).toFixed(1)}MB)`);
        }
      }

      if (this.onProgress) this.onProgress(0.96, "스프라이트 인덱스 생성 중...");
      const allBytes = new Uint8Array(receivedBytes);
      let position = 0;
      for (const chunk of chunks) {
        allBytes.set(chunk, position);
        position += chunk.length;
      }

      this.buffer = allBytes.buffer;
      this.parseIndex();
      this.ready = true;
      if (this.onProgress) this.onProgress(1.0, "준비 완료!");
      return true;
    } catch (e) {
      console.error("PakLoader init error:", e);
      return false;
    }
  }

  parseIndex() {
    const view = new DataView(this.buffer);
    const magic = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
    if (magic !== 'TPAK') {
      throw new Error("Invalid TPAK header: " + magic);
    }

    const count = view.getUint16(4, true);
    let offset = 6;
    const fileEntries = [];

    for (let i = 0; i < count; i++) {
      const nameLen = view.getUint8(offset++);
      let name = '';
      for (let j = 0; j < nameLen; j++) {
        name += String.fromCharCode(view.getUint8(offset++));
      }
      const size = view.getUint32(offset, true);
      offset += 4;
      fileEntries.push({ name, size });
    }

    let dataOffset = offset;
    for (const entry of fileEntries) {
      this.index.set(entry.name, {
        offset: dataOffset,
        size: entry.size
      });
      dataOffset += entry.size;
    }
    console.log(`TPAK initialized: ${this.index.size} sprite files indexed.`);
  }

  loadMon(dexNum, shiny = false) {
    const key = (shiny ? "ps" : "p") + String(dexNum).padStart(3, '0');
    if (this.monCache.has(key)) {
      return this.monCache.get(key);
    }

    const path = `mons/${key}.bin`;
    const entry = this.index.get(path);
    if (!entry) {
      // Try non-shiny fallback
      if (shiny) return this.loadMon(dexNum, false);
      return null;
    }

    const view = new DataView(this.buffer, entry.offset, entry.size);
    const parsed = this.parseTPK2(view);
    if (parsed) {
      this.monCache.set(key, parsed);
    }
    return parsed;
  }

  parseTPK2(view) {
    const magic = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
    if (magic !== 'TPK2') {
      console.warn("Not a TPK2 sprite:", magic);
      return null;
    }

    const nActs = view.getUint8(4);
    const palCount = view.getUint16(5, true);
    let offset = 7;

    const palette = [];
    for (let i = 0; i < palCount; i++) {
      const rgb565 = view.getUint16(offset, true);
      offset += 2;
      const r = (rgb565 >> 11) & 0x1f;
      const g = (rgb565 >> 5) & 0x3f;
      const b = rgb565 & 0x1f;
      const r8 = (r * 527 + 23) >> 6;
      const g8 = (g * 259 + 33) >> 6;
      const b8 = (b * 527 + 23) >> 6;
      palette.push([r8, g8, b8, 255]);
    }

    const acts = new Map();
    for (let a = 0; a < nActs; a++) {
      const actId = view.getUint8(offset++);
      const w = view.getUint8(offset++);
      const h = view.getUint8(offset++);
      const nFrames = view.getUint8(offset++);

      const frameMs = [];
      for (let f = 0; f < nFrames; f++) {
        frameMs.push(view.getUint16(offset, true));
        offset += 2;
      }

      const frames = [];
      const framePixels = w * h;

      for (let f = 0; f < nFrames; f++) {
        // Build ImageData for fast canvas rendering
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        const imgData = ctx.createImageData(w, h);
        const data32 = new Uint32Array(imgData.data.buffer);

        let lowestRow = 0;
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const idx = view.getUint8(offset++);
            if (idx !== 0xFF && idx < palette.length) {
              const [pr, pg, pb, pa] = palette[idx];
              const pIdx = y * w + x;
              data32[pIdx] = (pa << 24) | (pb << 16) | (pg << 8) | pr;
              if (y > lowestRow) lowestRow = y;
            }
          }
        }
        ctx.putImageData(imgData, 0, 0);
        frames.push({
          canvas,
          w,
          h,
          lowestRow: lowestRow + 1,
          ms: frameMs[f] || 120
        });
      }

      acts.set(actId, {
        actId,
        w,
        h,
        frames
      });
    }

    return {
      nActs,
      palette,
      acts
    };
  }
}

// Global instance
const pakLoader = new PakLoader();
