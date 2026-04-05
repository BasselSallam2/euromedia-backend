import { redisConnectionOptions } from "@cache/cacheClient";
import { Redis } from "ioredis";

const redis = new Redis(redisConnectionOptions());
export async function clearByPattern(pattern: string) {
    let cursor = "0";
    do {
        const [nextCursor, keys] = await redis.scan(cursor, "MATCH", pattern, "COUNT", 100);
        cursor = nextCursor;
        if (keys.length > 0) {
            await redis.del(keys);
        }
    } while (cursor !== "0");
}
