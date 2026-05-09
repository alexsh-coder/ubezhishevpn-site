const SHOP_ID = process.env.YOOKASSA_SHOP_ID ?? ''
const SECRET = process.env.YOOKASSA_SECRET_KEY ?? ''

function auth() {
  return 'Basic ' + Buffer.from(`${SHOP_ID}:${SECRET}`).toString('base64')
}

export async function createPayment(opts: {
  amountRub: number
  description: string
  invoiceId: string
  returnUrl: string
}): Promise<{ paymentUrl: string; yookassaId: string } | null> {
  if (!SHOP_ID || !SECRET) return null
  try {
    const res = await fetch('https://api.yookassa.ru/v3/payments', {
      method: 'POST',
      headers: {
        Authorization: auth(),
        'Content-Type': 'application/json',
        'Idempotence-Key': crypto.randomUUID(),
      },
      body: JSON.stringify({
        amount: { value: opts.amountRub.toFixed(2), currency: 'RUB' },
        confirmation: { type: 'redirect', return_url: opts.returnUrl },
        capture: true,
        description: opts.description,
        metadata: { invoice_id: opts.invoiceId },
      }),
    })
    if (!res.ok) return null
    const data = (await res.json()) as {
      id?: string
      confirmation?: { confirmation_url?: string }
    }
    return {
      paymentUrl: data.confirmation?.confirmation_url ?? '',
      yookassaId: data.id ?? '',
    }
  } catch {
    return null
  }
}
