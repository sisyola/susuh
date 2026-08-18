export default async function handler(req, res) {
  // 1. CORS Headers (biar bisa diakses dari frontend mana aja)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request dari browser
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Hanya terima method POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 2. Ambil data message langsung dari req.body (otomatis di-parse Vercel)
  const { message } = req.body || {};

  if (!message) {
    return res.status(400).json({ error: 'Pesan tidak boleh kosong' });
  }

  if (!process.env.DISCORD_WEBHOOK_URL) {
    return res.status(500).json({ error: 'DISCORD_WEBHOOK_URL belum di-set di Environment Variables' });
  }

  // 3. Kirim ke Discord Webhook
  try {
    const discordResponse = await fetch(process.env.DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'Web Logger Bot',
        content: String(message).slice(0, 2000), // batasan max 2000 karakter dari Discord
      }),
    });

    if (!discordResponse.ok) {
      throw new Error(`Discord error HTTP: ${discordResponse.status}`);
    }

    return res.status(200).json({ success: true, message: 'Berhasil terkirim!' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
