import { redisConnectionOptions } from "@/cache/cacheClient";
import mongoose from "mongoose";
import Cache from "ts-cache-mongoose";

const cache = Cache.init(mongoose, {
    defaultTTL: "60 seconds",
    engine: "redis",
    engineOptions: redisConnectionOptions() as any,
    debug: true,
});

export { cache };
