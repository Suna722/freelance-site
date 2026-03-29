// Vercel Serverless Function — お問い合わせフォーム API
// 環境変数: RESEND_API_KEY, MAIL_TO

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, company, email, message } = req.body;

    // バリデーション
    if (!name || !email || !message) {
      return res.status(400).json({ error: '必須項目が入力されていません' });
    }

    // Resend API でメール送信（無料枠: 月100通、十分）
    const mailTo = process.env.MAIL_TO || 'sugishimanaoya@gmail.com';
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      console.error('RESEND_API_KEY is not set');
      return res.status(500).json({ error: 'メール設定が未完了です' });
    }

    const mailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: 'お問い合わせフォーム <onboarding@resend.dev>',
        to: [mailTo],
        reply_to: email,
        subject: `【お問い合わせ】${name}様（${company || '個人'}）`,
        text: [
          `━━ 新しいお問い合わせ ━━`,
          ``,
          `氏名: ${name}`,
          `会社名: ${company || '（未記入）'}`,
          `メール: ${email}`,
          ``,
          `── ご相談内容 ──`,
          message,
          ``,
          `━━━━━━━━━━━━━━`,
        ].join('\n'),
      }),
    });

    if (mailResponse.ok) {
      return res.status(200).json({ success: true });
    } else {
      const errText = await mailResponse.text();
      console.error('Resend error:', errText);
      return res.status(500).json({ error: '送信に失敗しました' });
    }
  } catch (err) {
    console.error('Contact API error:', err);
    return res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
}
