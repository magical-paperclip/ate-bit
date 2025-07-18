// super-tiny message helper for ws traffic
// keeps client & server in sync

export const TYPES = {
  JOIN: 'join',
  INPUT: 'input',
  STATE: 'state',
  CHAT: 'chat',
  FULL: 'full'
};

export function makeMsg(type, game, room, payload = {}) {
  return { type, game, room, payload };
}

export function encode(msg) {
  return JSON.stringify(msg);
}

export function decode(str) {
  try { return JSON.parse(str); } catch { return null; }
} 