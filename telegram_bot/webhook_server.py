import os
import json
import logging
from aiohttp import web
from db import (
    get_payment, mark_payment_paid,
    get_user, user_has_any_paid, grant_referral_bonus,
)

log = logging.getLogger(__name__)

on_paid_callback = None

async def handle_webhook(request: web.Request):
    try:
        body_bytes = await request.read()
        log.info("Webhook RAW body: %s", body_bytes[:1000])
        event = json.loads(body_bytes)
    except Exception as e:
        log.error("Webhook: ошибка чтения тела: %s", e)
        return web.Response(status=400, text="bad json")

    log.info(
        "Webhook получен: %s",
        json.dumps(event, ensure_ascii=False)[:500]
    )

    event_type  = event.get("event", "")
    payment_obj = event.get("object", {})

    if event_type != "payment.succeeded":
        log.info("Webhook: игнорируем событие %s", event_type)
        return web.Response(text="ok")

    yookassa_payment_id = payment_obj.get("id", "")
    metadata   = payment_obj.get("metadata", {})
    invoice_id = metadata.get("invoice_id", "")

    log.info(
        "payment.succeeded: yookassa_id=%s invoice_id=%s",
        yookassa_payment_id, invoice_id
    )

    if not invoice_id:
        log.error(
            "Webhook: нет invoice_id в metadata! object=%s", payment_obj
        )
        return web.Response(text="ok")

    pay = get_payment(invoice_id)
    if not pay:
        log.error(
            "Webhook: платёж invoice_id=%s не найден в БД", invoice_id
        )
        return web.Response(text="ok")

    if pay["status"] == "paid":
        log.info(
            "Webhook: платёж %s уже обработан, пропускаем", invoice_id
        )
        return web.Response(text="ok")

    user_id  = pay["user_id"]
    tariff   = pay.get("tariff", "")
    days     = pay.get("days", 0)
    amount   = pay.get("amount", 0.0)
    is_first = not user_has_any_paid(user_id)

    # Помечаем оплаченным ДО выдачи — защита от дублей
    mark_payment_paid(
        invoice_id=invoice_id,
        yookassa_payment_id=yookassa_payment_id,
    )
    log.info("Webhook: платёж %s помечен как paid", invoice_id)

    if not on_paid_callback:
        log.error("Webhook: on_paid_callback не установлен!")
        return web.Response(text="ok")

    # Реферальный бонус (только для первой оплаты подписки)
    db_user = get_user(user_id)
    if (
        is_first
        and db_user
        and db_user.get("referrer_id")
        and tariff not in ("balance", "devices")
    ):
        granted = grant_referral_bonus(db_user["referrer_id"], user_id)
        if granted:
            log.info(
                "Webhook: реферальный бонус -> user %s",
                db_user["referrer_id"]
            )
            try:
                await on_paid_callback(
                    kind="referral_bonus",
                    user_id=db_user["referrer_id"],
                    days=30,
                    amount=0.0,
                    tariff="referral",
                    invoice_id="",
                )
            except Exception as e:
                log.error("Webhook: ошибка реферального бонуса: %s", e)

    # Основной коллбек
    try:
        if tariff == "balance":
            log.info(
                "Webhook: пополнение баланса user=%s amount=%s",
                user_id, amount
            )
            await on_paid_callback(
                kind="balance_topup",
                user_id=user_id,
                days=0,
                amount=float(amount),
                tariff="balance",
                invoice_id=invoice_id,
            )
        elif tariff == "devices":
            log.info(
                "Webhook: добавляем устройства user=%s", user_id
            )
            await on_paid_callback(
                kind="devices",
                user_id=user_id,
                days=0,
                amount=float(amount),
                tariff="devices",
                invoice_id=invoice_id,
            )
        else:
            log.info(
                "Webhook: выдаём подписку user=%s tariff=%s days=%s",
                user_id, tariff, days
            )
            await on_paid_callback(
                kind="purchase",
                user_id=user_id,
                days=int(days),
                amount=float(amount),
                tariff=tariff,
                invoice_id=invoice_id,
            )
    except Exception as e:
        log.error("Webhook: ошибка on_paid_callback: %s", e)

    return web.Response(text="ok")

async def handle_health(request: web.Request):
    return web.Response(text="ok")

async def handle_webhook_get(request: web.Request):
    bot_username = os.getenv("PUBLIC_BOT_USERNAME", "")
    raise web.HTTPFound(f"https://t.me/{bot_username}")

async def handle_test_pay(request: web.Request):
    """GET /test_pay?invoice_id=XXX  — только для отладки, убрать в проде"""
    invoice_id = request.rel_url.query.get("invoice_id", "")
    if not invoice_id or not on_paid_callback:
        return web.Response(text="no invoice_id or no callback")

    from db import get_payment, mark_payment_paid
    pay = get_payment(invoice_id)
    if not pay:
        return web.Response(text=f"payment {invoice_id} not found")

    mark_payment_paid(invoice_id, "test_yookassa_id")

    tariff = pay.get("tariff", "")
    if tariff == "balance":
        await on_paid_callback(
            kind="balance_topup", user_id=pay["user_id"],
            days=0, amount=float(pay["amount"]),
            tariff="balance", invoice_id=invoice_id,
        )
    elif tariff == "devices":
        await on_paid_callback(
            kind="devices", user_id=pay["user_id"],
            days=0, amount=float(pay["amount"]),
            tariff="devices", invoice_id=invoice_id,
        )
    else:
        await on_paid_callback(
            kind="purchase", user_id=pay["user_id"],
            days=int(pay["days"]), amount=float(pay["amount"]),
            tariff=tariff, invoice_id=invoice_id,
        )
    return web.Response(text=f"ok, processed {invoice_id}")

def make_app() -> web.Application:
    app = web.Application()
    app.router.add_post("/yookassa/webhook", handle_webhook)
    app.router.add_get("/yookassa/webhook",  handle_webhook_get)
    app.router.add_get("/health",            handle_health)
    app.router.add_get("/test_pay",          handle_test_pay)  # ← добавить
    return app