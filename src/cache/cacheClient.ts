import type { RedisOptions } from "ioredis";
import dotenv from "dotenv";
dotenv.config();

export function redisConnectionOptions(): RedisOptions {
  const redisUrl = new URL(
    process.env.REDIS_URL || ""
  );

  return {
    username: redisUrl.username,
    password: redisUrl.password,
    host: redisUrl.hostname,
    port: parseInt(redisUrl.port, 10),
  };
}
