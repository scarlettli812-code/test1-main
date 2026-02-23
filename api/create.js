import { Redis } from '@upstash/redis'
const redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN })
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ msg: 'Method Not Allowed' });
  const { ttlHours, uses, adminPass } = req.body;
  if (adminPass !== process.env.ADMIN_PASSWORD) return res.status(403).json({ msg: '管理密码错误' });
  const code = Math.random().toString(36).substring(2, 6).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
  const data = { code, createdAt: Date.now(), expiresAt: Date.now() + (ttlHours * 3600 * 1000), usesLeft: uses, totalUses: uses };
  await redis.set(`code:${code}`, JSON.stringify(data));
  return res.status(200).json(data);
}
