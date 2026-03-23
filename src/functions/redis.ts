import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getRedisClient } from "../redisClient";

export async function redis(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    try {
        context.log("Getting client");
        const client = await getRedisClient(context);
        context.log("Setting 'Foo' to 'Bar'");
        await client.set("Foo", "Bar");
        context.log("OK");


        return { body: "OK" };
    } catch (error) {
        context.error(error);
        return { status: 502, body: "Not OK" };
    }

};

app.http('redis', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: redis
});
