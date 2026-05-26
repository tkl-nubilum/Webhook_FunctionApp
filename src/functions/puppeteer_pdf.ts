import {
    app,
    type HttpRequest,
    type HttpResponseInit,
    type InvocationContext,
} from "@azure/functions";

import puppeteer from "puppeteer";
import chromium from "@sparticuz/chromium";

chromium.setGraphicsMode = false;

export async function puppeteer_pdf(
    request: HttpRequest,
    context: InvocationContext,
): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    const destUrl = request.params.destUrl;

    if (!URL.canParse(destUrl)) {
        return { status: 400, body: "Invalid URL\n" };
    }

    try {
        const browser = await puppeteer.launch({
            args: await puppeteer.defaultArgs({ args: chromium.args, headless: "shell" }),
            executablePath: await chromium.executablePath(),
            headless: "shell",
        });

        const page = await browser.newPage();
        await page.goto(destUrl, { waitUntil: "networkidle0" });
        const pdf = await page.pdf();
        await browser.close();

        return {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": 'inline; filename="generated.pdf"',
                "Content-Length": pdf.length.toString(),
            },
            body: pdf,
        };
    } catch (error) {
        return { status: 500, body: `Failed to get PDF from puppeteer\n${error}` };
    }
}

app.http("puppeteer-pdf", {
    methods: ["GET", "POST"],
    authLevel: "anonymous",
    handler: puppeteer_pdf,
});
