import os
import uuid
import logging
import aiohttp
from typing import Optional

log = logging.getLogger(__name__)

YOOKASSA_API_URL = "https://api.yookassa.ru/v3/payments"

async def create_payment(
    amount_rub: float,
    description: str,
    invoice_id: str,
    return_url: str,
    customer_email: Optional[str] = None,
) -> Optional[dict]:
    # Читаем переменные здесь, а не на уровне модуля
    shop_id    = os.getenv("YOOKASSA_SHOP_ID", "").strip()
    secret_key = os.getenv("YOOKASSA_SECRET_KEY", "").strip()

    log.info("ЮKassa auth: shop_id=%r secret_key_len=%d", shop_id, len(secret_key))

    if not shop_id or not secret_key:
        log.error("YOOKASSA_SHOP_ID или YOOKASSA_SECRET_KEY не заданы!")
        return None

    idempotence_key = str(uuid.uuid4())

    payload: dict = {
        "amount": {
            "value": f"{amount_rub:.2f}",
            "currency": "RUB",
        },
        "confirmation": {
            "type": "redirect",
            "return_url": return_url,
        },
        "capture": True,
        "description": description,
        "metadata": {
            "invoice_id": invoice_id,
        },
    }

    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                YOOKASSA_API_URL,
                json=payload,
                auth=aiohttp.BasicAuth(shop_id, secret_key),
                headers={"Idempotence-Key": idempotence_key},
                timeout=aiohttp.ClientTimeout(total=15),
            ) as resp:
                data = await resp.json()
                if resp.status not in (200, 201):
                    log.error("ЮKassa create_payment HTTP %s: %s", resp.status, data)
                    return None
                return data
    except Exception as e:
        log.error("ЮKassa create_payment error: %s", e)
        return None