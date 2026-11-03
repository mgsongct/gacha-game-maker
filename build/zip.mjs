// 배포 zip 읽기·쓰기(의존성 없음, node:zlib): PC 서버 배포본(gacha-game-maker-pc.zip)을 build.mjs --zip으로 묶고 --check·테스트가 대조함.
// 같은 파일이면 같은 zip이 나오게 시각을 고정(1980-01-01), 파일 이름은 UTF-8 표시(PC서버-시작.bat)
import { deflateRawSync, inflateRawSync } from 'node:zlib';

const CRC = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
export const crc32 = b => { let c = 0xFFFFFFFF; for (const x of b) c = CRC[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
export function zipWrite(entries) { const parts = [], cen = []; let off = 0;
  for (const { name, data } of entries) { const nm = Buffer.from(name, 'utf8'), body = deflateRawSync(data), crc = crc32(data), h = Buffer.alloc(30);
    h.writeUInt32LE(0x04034b50, 0); h.writeUInt16LE(20, 4); h.writeUInt16LE(0x0800, 6); h.writeUInt16LE(8, 8); h.writeUInt16LE(0, 10); h.writeUInt16LE(0x21, 12); h.writeUInt32LE(crc, 14); h.writeUInt32LE(body.length, 18); h.writeUInt32LE(data.length, 22); h.writeUInt16LE(nm.length, 26); h.writeUInt16LE(0, 28);
    const c = Buffer.alloc(46); c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(0x0314, 4); c.writeUInt32LE(0o100644 * 65536, 38); /* 원본 배포 zip처럼 유닉스 권한 0644 */ c.writeUInt16LE(20, 6); c.writeUInt16LE(0x0800, 8); c.writeUInt16LE(8, 10); c.writeUInt16LE(0, 12); c.writeUInt16LE(0x21, 14); c.writeUInt32LE(crc, 16); c.writeUInt32LE(body.length, 20); c.writeUInt32LE(data.length, 24); c.writeUInt16LE(nm.length, 28); c.writeUInt32LE(off, 42);
    parts.push(h, nm, body); cen.push(c, nm); off += 30 + nm.length + body.length; }
  const cd = Buffer.concat(cen), e = Buffer.alloc(22); e.writeUInt32LE(0x06054b50, 0); e.writeUInt16LE(entries.length, 8); e.writeUInt16LE(entries.length, 10); e.writeUInt32LE(cd.length, 12); e.writeUInt32LE(off, 16);
  return Buffer.concat([...parts, cd, e]); }
export function zipRead(buf) { const out = new Map(); let e = buf.length - 22; while (e >= 0 && buf.readUInt32LE(e) !== 0x06054b50) e--; if (e < 0) throw Error('zip 끝 표시가 없어요');
  let p = buf.readUInt32LE(e + 16); for (let i = 0, n = buf.readUInt16LE(e + 10); i < n; i++) { const m = buf.readUInt16LE(p + 10), cs = buf.readUInt32LE(p + 20), nl = buf.readUInt16LE(p + 28), xl = buf.readUInt16LE(p + 30), cl = buf.readUInt16LE(p + 32), lo = buf.readUInt32LE(p + 42), name = buf.slice(p + 46, p + 46 + nl).toString('utf8');
    const ds = lo + 30 + buf.readUInt16LE(lo + 26) + buf.readUInt16LE(lo + 28), raw = buf.slice(ds, ds + cs); out.set(name, m === 8 ? inflateRawSync(raw) : raw); p += 46 + nl + xl + cl; }
  return out; }
