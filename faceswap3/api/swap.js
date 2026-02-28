export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { swap_image, target_image } = req.body;
  const apiKey = process.env.FAL_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'FAL API Key 未配置' });

  try {
    // 直接用 fal-ai/face-swap，传 base64 dataURL
    const submitRes = await fetch('https://queue.fal.run/fal-ai/face-swap', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        base_image_url: swap_image,
        swap_image_url: target_image
      })
    });

    const data = await submitRes.json();
    if (data.detail) return res.status(400).json({ error: JSON.stringify(data.detail) });
    return res.status(200).json({ request_id: data.request_id });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
