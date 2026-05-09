const BASE = (process.env.REMNA_URL ?? "").replace(/\/$/, "");
const TOKEN = process.env.REMNA_API_TOKEN ?? "";
const INBOUND = process.env.REMNA_INBOUND_UUID ?? "";
function h() {
  return {
    Authorization: `Bearer ${TOKEN}`,
    "Content-Type": "application/json",
    Accept: "application/json"
  };
}
async function getUserDevices(userUuid) {
  try {
    const res = await fetch(`${BASE}/api/hwid/devices/${userUuid}`, { headers: h() });
    if (!res.ok) return [];
    const data = await res.json();
    const r = data.response ?? data;
    return r.devices ?? [];
  } catch {
    return [];
  }
}
async function deleteDevice(userUuid, hwid) {
  try {
    const res = await fetch(`${BASE}/api/hwid/devices/delete`, {
      method: "POST",
      headers: h(),
      body: JSON.stringify({ userUuid, hwid })
    });
    return res.ok;
  } catch {
    return false;
  }
}
async function getUser(userUuid) {
  try {
    const res = await fetch(`${BASE}/api/users/${userUuid}`, { headers: h() });
    if (!res.ok) return null;
    const data = await res.json();
    return data.response ?? data;
  } catch {
    return null;
  }
}
async function createUser(opts) {
  try {
    const payload = {
      username: opts.username,
      trafficLimitBytes: opts.trafficLimitBytes ?? 0,
      trafficLimitStrategy: "NO_RESET",
      expireAt: opts.expireAt.toISOString().slice(0, 23) + ".000Z",
      status: "ACTIVE",
      description: opts.description ?? "",
      telegramId: opts.telegramId ? Number(opts.telegramId) : null,
      hwidDeviceLimit: opts.deviceLimit ?? 4
    };
    if (INBOUND) payload.activeInternalSquads = [INBOUND];
    const res = await fetch(`${BASE}/api/users`, {
      method: "POST",
      headers: h(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.response ?? data;
  } catch {
    return null;
  }
}
async function updateUserExpire(userUuid, expireAt) {
  try {
    const res = await fetch(`${BASE}/api/users`, {
      method: "PATCH",
      headers: h(),
      body: JSON.stringify({
        uuid: userUuid,
        expireAt: expireAt.toISOString().slice(0, 23) + ".000Z",
        status: "ACTIVE"
      })
    });
    return res.ok;
  } catch {
    return false;
  }
}
async function setDeviceLimit(userUuid, limit) {
  try {
    const res = await fetch(`${BASE}/api/users`, {
      method: "PATCH",
      headers: h(),
      body: JSON.stringify({ uuid: userUuid, hwidDeviceLimit: limit })
    });
    return res.ok;
  } catch {
    return false;
  }
}
export {
  getUserDevices as a,
  createUser as c,
  deleteDevice as d,
  getUser as g,
  setDeviceLimit as s,
  updateUserExpire as u
};
