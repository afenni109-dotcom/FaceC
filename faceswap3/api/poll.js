export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { id } = req.query;
  const apiKey = process.env.REPLICATE_API_KEY;
  if (!id) return res.status(400).json({ error: '缺少 id' });

  try {
    const r = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    const data = await r.json();
    if (data.status === 'succeeded') {
      const output = Array.isArray(data.output) ? data.output[0] : data.output;
      return res.status(200).json({ status: 'succeeded', output });
    }
    return res.status(200).json({ status: data.status, error: data.error });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
