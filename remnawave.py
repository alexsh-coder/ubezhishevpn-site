import os
import logging
from datetime import datetime
from typing import Optional
import aiohttp

log = logging.getLogger(__name__)

class RemnawaveClient:
    def __init__(self, base_url: str, api_token: str):
        self.base_url = base_url.rstrip("/")
        self.api_token = api_token
        self._session: Optional[aiohttp.ClientSession] = None

    def _headers(self) -> dict:
        return {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

    async def _get_session(self) -> aiohttp.ClientSession:
        if self._session is None or self._session.closed:
            self._session = aiohttp.ClientSession(headers=self._headers())
        return self._session

    async def get_inbounds(self) -> list:
        session = await self._get_session()
        try:
            async with session.get(
                f"{self.base_url}/api/inbounds",
                timeout=aiohttp.ClientTimeout(total=10),
            ) as resp:
                data = await resp.json()
                return data.get("response", data)
        except Exception as e:
            log.error("get_inbounds error: %s", e)
            return []

    async def create_user(self, username, expire_at, traffic_limit_bytes=0,
                          traffic_limit_strategy="NO_RESET", description="",
                          device_limit=2, telegram_id=None):
        session = await self._get_session()
        inbound_uuid = os.getenv("REMNA_INBOUND_UUID", "").strip()
        payload = {
            "username": username,
            "trafficLimitBytes": traffic_limit_bytes,
            "trafficLimitStrategy": traffic_limit_strategy,
            "expireAt": expire_at.strftime("%Y-%m-%dT%H:%M:%S.000Z"),
            "status": "ACTIVE",
            "description": description,
            "telegramId": telegram_id,
            "hwidDeviceLimit": device_limit,
        }
        if inbound_uuid:
            payload["activeInternalSquads"] = [inbound_uuid]
        try:
            async with session.post(
                f"{self.base_url}/api/users", json=payload,
                timeout=aiohttp.ClientTimeout(total=15),
            ) as resp:
                if resp.status not in (200, 201):
                    log.error("create_user HTTP %s: %s",
                              resp.status, await resp.text())
                    return None
                data = await resp.json()
                return data.get("response", data)
        except Exception as e:
            log.error("create_user error: %s", e)
            return None

    async def update_user_expire(self, user_uuid, new_expire_at):
        session = await self._get_session()
        payload = {
            "uuid": user_uuid,
            "expireAt": new_expire_at.strftime("%Y-%m-%dT%H:%M:%S.000Z"),
            "status": "ACTIVE",
        }
        try:
            async with session.patch(
                f"{self.base_url}/api/users", json=payload,
                timeout=aiohttp.ClientTimeout(total=15),
            ) as resp:
                return resp.status in (200, 204)
        except Exception as e:
            log.error("update_user_expire error: %s", e)
            return False

    async def set_device_limit(self, user_uuid, device_limit):
        session = await self._get_session()
        payload = {"uuid": user_uuid, "hwidDeviceLimit": device_limit}
        try:
            async with session.patch(
                f"{self.base_url}/api/users", json=payload,
                timeout=aiohttp.ClientTimeout(total=15),
            ) as resp:
                return resp.status in (200, 204)
        except Exception as e:
            log.error("set_device_limit error: %s", e)
            return False

    async def get_user(self, user_uuid):
        session = await self._get_session()
        try:
            async with session.get(
                f"{self.base_url}/api/users/{user_uuid}",
                timeout=aiohttp.ClientTimeout(total=10),
            ) as resp:
                if resp.status != 200:
                    return None
                data = await resp.json()
                return data.get("response", data)
        except Exception as e:
            log.error("get_user error: %s", e)
            return None

    async def get_user_devices(self, user_uuid):
        session = await self._get_session()
        try:
            async with session.get(
                f"{self.base_url}/api/hwid/devices/{user_uuid}",
                timeout=aiohttp.ClientTimeout(total=10),
            ) as resp:
                if resp.status != 200:
                    return {"devices": []}
                data = await resp.json()
                return data.get("response", data)
        except Exception as e:
            log.error("get_user_devices error: %s", e)
            return {"devices": []}

    async def delete_device(self, user_uuid: str, hwid: str) -> bool:
        session = await self._get_session()
        try:
            async with session.post(
                f"{self.base_url}/api/hwid/devices/delete",
                json={"userUuid": user_uuid, "hwid": hwid},
                timeout=aiohttp.ClientTimeout(total=10),
            ) as resp:
                if resp.status not in (200, 204):
                    log.error("delete_device HTTP %s: %s",
                              resp.status, await resp.text())
                    return False
                return True
        except Exception as e:
            log.error("delete_device error: %s", e)
            return False

    async def delete_user(self, user_uuid: str) -> bool:
        session = await self._get_session()
        try:
            async with session.delete(
                f"{self.base_url}/api/users/{user_uuid}",
                timeout=aiohttp.ClientTimeout(total=10),
            ) as resp:
                return resp.status in (200, 204)
        except Exception as e:
            log.error("delete_user error: %s", e)
            return False

    async def close(self):
        if self._session and not self._session.closed:
            await self._session.close()