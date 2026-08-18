export default async function handler(req, res) {
  // 1. CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request (OPTIONS) dari browser
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Hanya izinkan method POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 2. Ambil data message dari body
  const { message } = req.body || {};

  if (!message) {
    return res.status(400).json({ error: 'Pesan tidak boleh kosong' });
  }

  // Cek apakah Webhook URL sudah ada di Environment Variables Vercel
  if (!process.env.DISCORD_WEBHOOK_URL) {
    return res.status(500).json({ error: 'DISCORD_WEBHOOK_URL belum di-set' });
  }

  // 3. Kirim payload ke Discord Webhook
  try {
    const discordResponse = await fetch(process.env.DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'Web Logger Bot',
        content: String(message).slice(0, 2000), // Proteksi limit 2000 karakter Discord
      }),
    });

    if (!discordResponse.ok) {
      throw new Error(`Discord error HTTP status: ${discordResponse.status}`);
    }

    return res.status(200).json({ success: true, message: 'Berhasil terkirim!' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
