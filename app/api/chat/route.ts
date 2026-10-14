import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        const message =
            body?.message ??
            body?.text ??
            body?.content ??
            body?.input ??
            body?.query;

        const sessionId = body?.sessionId ?? null;

        if (
            typeof message !== "string" ||
            !message.trim()
        ) {
            return NextResponse.json(
                {
                    error: "Message is required",
                },
                { status: 400 }
            );
        }

        const apiUrl =
            "https://cpab.cogitx.ai/project/exports/rest-api/6abd1b760a770ebb8786eca2/jobs";

        const clientId =
            "cx_fe1b9b39daeaf81519458617";

        const clientSecret =
            "t-U-7pvdfnoIphn3iOmC5oP0of3ezLC_o6K7k6q_Eos";

        const url = new URL(apiUrl);

        url.searchParams.set("waitSeconds", "30");

        if (sessionId) {
            url.searchParams.set("sessionId", sessionId);
        }

        console.log("=================================");
        console.log("COGITX REQUEST");
        console.log("=================================");
        console.log("URL:", url.toString());
        console.log("Message:", message);
        console.log("Client ID:", clientId);
        console.log("Client Secret: LOADED");

        const cogitxResponse = await fetch(
            url.toString(),
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-client-id": clientId,
                    "x-client-secret": clientSecret,
                },
                body: JSON.stringify({
                    text: message,
                }),
                cache: "no-store",
            }
        );

        const rawText = await cogitxResponse.text();

        console.log("=================================");
        console.log("COGITX RESPONSE");
        console.log("=================================");
        console.log("Status:", cogitxResponse.status);
        console.log("Status Text:", cogitxResponse.statusText);
        console.log("Response:", rawText);

        if (!cogitxResponse.ok) {
            return NextResponse.json(
                {
                    error: "Sorry, I couldn't get a response. CogitX API request failed",
                    status: cogitxResponse.status,
                    details: rawText,
                },
                { status: cogitxResponse.status }
            );
        }

        let data: any;

        try {
            data = JSON.parse(rawText);
        } catch {
            return NextResponse.json({
                reply: rawText,
                sessionId,
            });
        }

        const returnedSessionId =
            data?.data?.sessionId ??
            data?.sessionId ??
            sessionId ??
            null;

        const reply =
            data?.data?.output?.workflow_response?.content?.text ??
            data?.data?.output?.variables?.text ??
            data?.data?.output?.text ??
            data?.data?.node_unified_output?.text ??
            data?.data?.node_agent?.text ??
            null;

        console.log("=================================");
        console.log("EXTRACTED ANSWER");
        console.log("=================================");
        console.log(reply);

        if (
            typeof reply !== "string" ||
            !reply.trim()
        ) {
            return NextResponse.json(
                {
                    reply: "The workflow completed but returned an empty response.",
                    sessionId: returnedSessionId,
                },
                { status: 200 }
            );
        }

        return NextResponse.json(
            {
                reply: reply.trim(),
                sessionId: returnedSessionId,
            },
            { status: 200 }
        );

    } catch (error: any) {
        console.error("=================================");
        console.error("CHAT API ERROR");
        console.error("=================================");
        console.error(error);

        return NextResponse.json(
            {
                error: error?.message || "Internal server error",
            },
            { status: 500 }
        );
    }
}