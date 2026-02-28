export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { request_id } = req.query;
  const apiKey = process.env.FAL_API_KEY;
  if (!request_id) return res.status(400).json({ error: '缺少 request_id' });

  try {
    // 检查状态
    const statusRes = await fetch(`https://queue.fal.run/fal-ai/face-swap/requests/${request_id}/status`, {
      headers: { 'Authorization': `Key ${apiKey}` }
    });
    const status = await statusRes.json();

    if (status.status === 'COMPLETED') {
      // 获取结果
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
