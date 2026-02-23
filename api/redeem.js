import { Redis } from '@upstash/redis'
const redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN })
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ msg: 'Method Not Allowed' });
  const { code, claimer } = req.body;
  const key = `code:${code.toUpperCase()}`;
  const data = await redis.get(key);
  if (!data) return res.status(404).json({ ok: false, msg: '激活码无效' });
  if (Date.now() > data.expiresAt) return res.status(403).json({ ok: false, msg: '激活码已过期' });
  if (data.usesLeft <= 0) return res.status(403).json({ ok: false, msg: '激活码已被使用' });
  data.usesLeft -= 1;
  await redis.set(key, JSON.stringify(data));
  return res.status(200).json({ ok: true, code, meta: data });
}