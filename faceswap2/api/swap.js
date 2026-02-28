export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { swap_image, target_image } = req.body;
  const apiKey = process.env.REPLICATE_API_KEY;

  if (!apiKey) return res.status(500).json({ error: 'API Key 未配置' });
  if (!swap_image || !target_image) return res.status(400).json({ error: '请提供两张图片' });

  try {
    // 使用 lucataco/faceswap 模型，更稳定
    const createRes = await fetch('https://api.replicate.com/v1/models/lucataco/faceswap/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'wait=55'
      },
      body: JSON.stringify({
        input: {
          source_image: swap_image,
          target_image: target_image
        }
      })
    });

    const prediction = await createRes.json();
    if (prediction.error) return res.status(400).json({ error: prediction.error });

    if (prediction.status === 'succeeded') {
      const output = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
      return res.status(200).json({ output });
    }

    // 返回 id 供前端轮询
    return res.status(200).json({ id: prediction.id, status: prediction.status });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
