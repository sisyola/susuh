// Rate limit in-memory sederhana
const rateLimitMap = new Map();

export default async function handler(req, res) {
    // Hanya izinkan method POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // 1. Ambil IP Client buat Rate Limiting (Anti-Spam)
    const clientIp = req.headers['x-forwarded-for'] || 'unknown';
    const now = Date.now();
    const windowMs = 60 * 1000; // Jeda 1 menit
    const maxRequests = 10;      // Maksimal 10 request per menit per IP

    const userRequests = rateLimitMap.get(clientIp) || [];
    const recentRequests = userRequests.filter(timestamp => now - timestamp < windowMs);

    // Kalau lewatin limit, tahan request-nya!
    if (recentRequests.length >= maxRequests) {
        return res.status(429).json({ error: 'Spam terdeteksi! Coba lagi nanti.' });
    }

    recentRequests.push(now);
    rateLimitMap.set(clientIp, recentRequests);

    // 2. Ambil data pesan dari request body
    const { message } = req.body;
    if (!message) {
        return res.status(400).json({ error: 'Pesan tidak boleh kosong' });
    }

    // 3. Kirim ke Discord Webhook via Environment Variable
    try {
        const discordResponse = await fetch(process.env.DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'Web Logger Bot',
                content: message
            })
        });

        if (!discordResponse.ok) {
            throw new Error('Gagal mengirim ke Discord');
        }

        return res.status(200).json({ success: true, message: 'Terkirim!' });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
