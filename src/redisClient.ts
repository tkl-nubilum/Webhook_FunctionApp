import { InvocationContext } from "@azure/functions";
import { createClient, RedisClientOptions, RedisClientType } from "redis";

let _client: RedisClientType | null = null;

export async function getRedisClient(context: InvocationContext) {
	if (_client === null) {
		for (const envVar of ["REDIS_PORT", "REDIS_PASSWORD", "REDIS_HOST"]) {
			if (!process.env[envVar]) {
				throw new Error(`${envVar} must be set`);
			}
		}

		_client = createClient({
			password: process.env.REDIS_PASSWORD,		// primary access key
			socket: {
				host: process.env.REDIS_HOST,			// dns.redis.cache.windows.net
				port: Number(process.env.REDIS_PORT),	// 6380 for azure
				tls: true,
			},

		});

		_client.on("error", console.error);

		await _client.connect();
	}
	return _client;
}
