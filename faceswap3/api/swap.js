
javascriptexport default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { swap_image, target_image } = req.body;
  const apiKey = process.env.FAL_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'FAL API Key 未配置' });

  try {
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
    if (data.detail) return res.status(400).json({ error: data.detail });

    return res.status(200).json({ request_id: data.request_id, status_url: data.status_url });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
poll.js 也要更新，复制这里：
javascriptexport default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { request_id } = req.query;
  const apiKey = process.env.FAL_API_KEY;
  if (!request_id) return res.status(400).json({ error: '缺少 request_id' });

  try {
    const statusRes = await fetch(`https://queue.fal.run/fal-ai/face-swap/requests/${request_id}/status`, {
      headers: { 'Authorization': `Key ${apiKey}` }
    });
    const status = await statusRes.json();

    if (status.status === 'COMPLETED') {
      const resultRes = await fetch(`https://queue.fal.run/fal-ai/face-swap/requests/${request_id}`, {
        headers: { 'Authorization': `Key ${apiKey}` }
      });
      const result = await resultRes.json();
      const output = result.image?.url || result.images?.[0]?.url;
      return res.status(200).json({ status: 'succeeded', output });
    }

    if (status.status === 'FAILED') {
      return res.status(200).json({ status: 'failed', error: '换脸失败，请重试' });
    }

    return res.status(200).json({ status: 'processing' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
