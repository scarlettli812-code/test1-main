import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ msg: 'Method Not Allowed' });
  
  const { ttlHours, uses, adminPass, count = 1 } = req.body;

  if (adminPass !== process.env.ADMIN_PASSWORD) {
    return res.status(403).json({ msg: '管理密码错误' });
  }

  // 限制单词最高生成 100 个，防止数据库压力过大
  const batchCount = Math.min(Math.max(count, 1), 100);
  const generatedCodes = [];
  const expiresAt = Date.now() + (ttlHours * 3600 * 1000);

  for (let i = 0; i < batchCount; i++) {
    // 生成随机 8 位码：XXXX-XXXX
    const code = Math.random().toString(36).substring(2, 6).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    
    const data = {
      code,
      createdAt: Date.now(),
      expiresAt: expiresAt,
      usesLeft: uses,
      totalUses: uses
    };

    // 存入数据库
    await redis.set(`code:${code}`, JSON.stringify(data));
    generatedCodes.push(code);
  }

  return res.status(200).json({ codes: generatedCodes, expiresAt });
}