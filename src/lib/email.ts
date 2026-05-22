import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  await resend.emails.send({
    from: 'УбежищеVPN <no-reply@ubezhishe.space>',
    to,
    subject: 'Восстановление пароля — УбежищеVPN',
    html: `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#0f1117;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1117;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:480px;background:#161b27;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:32px 32px 24px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.06);">
              <div style="display:inline-block;width:48px;height:48px;background:rgba(99,102,241,0.15);border-radius:50%;line-height:48px;font-size:22px;margin-bottom:16px;">🔐</div>
              <h1 style="margin:0;color:#f1f5f9;font-size:22px;font-weight:700;">Восстановление пароля</h1>
              <p style="margin:8px 0 0;color:#64748b;font-size:14px;">УбежищеVPN</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px;">
              <p style="margin:0 0 20px;color:#94a3b8;font-size:15px;line-height:1.6;">
                Мы получили запрос на восстановление пароля для вашего аккаунта. Нажмите кнопку ниже, чтобы задать новый пароль.
              </p>
              <div style="text-align:center;margin:28px 0;">
                <a href="${resetUrl}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;border-radius:12px;font-weight:600;font-size:15px;">
                  Сбросить пароль
                </a>
              </div>
              <p style="margin:20px 0 0;color:#64748b;font-size:13px;line-height:1.6;">
                Ссылка действительна <strong style="color:#94a3b8;">1 час</strong>. Если вы не запрашивали восстановление пароля — просто проигнорируйте это письмо.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
              <p style="margin:0;color:#475569;font-size:12px;">
                Если кнопка не работает, скопируйте эту ссылку в браузер:<br/>
                <a href="${resetUrl}" style="color:#6366f1;word-break:break-all;">${resetUrl}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
  })
}
