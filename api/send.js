const rateLimitMap = new Map();

export default async function handler(req, res) {
    // 0. CORS: izinkan semua origin + tangani preflight
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(204).end(); // bales preflight, browser lanjut kirim POST
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // 1. Rate limit
    const clientIp = (req.headers['x-forwarded-for'] || 'unknown').split(',')[0].trim();
    const now = Date.now();
    const windowMs = 60 * 1000;
    const maxRequests = 10;

    const userRequests = rateLimitMap.get(clientIp) || [];
    const recentRequests = userRequests.filter(t => now - t < windowMs);

    if (recentRequests.length >= maxRequests) {
        return res.status(429).json({ error: 'Spam terdeteksi! Coba lagi nanti.' });
    }

    recentRequests.push(now);
    rateLimitMap.set(clientIp, recentRequests);

    // 2. Parse body (aman, handle JSON string juga)
    let body = req.body;
    if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = {}; }
    }

    const { message } = body || {};
    if (!message) {
        return res.status(400).json({ error: 'Pesan tidak boleh kosong' });
    }

    if (!process.env.DISCORD_WEBHOOK_URL) {
        return res.status(500).json({ error: 'DISCORD_WEBHOOK_URL belum di-set' });
    }

    // 3. Kirim ke Discord (truncate biar aman dari limit 2000 karakter)
    try {
        const discordResponse = await fetch(process.env.DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'Web Logger Bot',
                content: String(message).slice(0, 2000)
            })
        });

        if (!discordResponse.ok) {
            throw new Error(`Discord nolak: ${discordResponse.status}`);
        }

        return res.status(200).json({ success: true, message: 'Terkirim!' });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
