import { NextRequest, NextResponse } from "next/server";

const COGITX_API_URL =
  process.env.COGITX_API_URL ||
  "https://cpab.cogitx.ai/project/exports/rest-api/6ae9920f0d2d977e7d2930e7/jobs";

const COGITX_CLIENT_ID =
  process.env.COGITX_CLIENT_ID || "cx_eb17e551cccd4a592d167d77";

const COGITX_CLIENT_SECRET =
  process.env.COGITX_CLIENT_SECRET ||
  "mGXPX8pziA_gRq9c9ouZAqhPM6oPEmtUNDK8Usx9FV0";

const COGITX_WAIT_SECONDS = process.env.COGITX_WAIT_SECONDS || "30";

async function pollJobUntilDone(jobId: string, maxAttempts = 15): Promise<any> {
  const url = `https://cpab.cogitx.ai/project/exports/rest-api/6ae9920f0d2d977e7d2930e7/jobs/${jobId}`;

  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((res) => setTimeout(res, 2000));

    try {
      const res = await fetch(url, {
        headers: {
          "x-client-id": COGITX_CLIENT_ID,
          "x-client-secret": COGITX_CLIENT_SECRET,
        },
        cache: "no-store",
      });

      if (!res.ok) continue;

      const data = await res.json();
      if (data?.data?.isCompleted) {
        return data;
      }
    } catch (e) {
      console.error("Polling attempt failed:", e);
    }
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body?.action || "submit";
    const playerName = body?.playerName || "Player";

    let payload: Record<string, any> = { action, player_name: playerName };

    if (action === "submit") {
      const uiGrid: Record<string, string> = body?.grid || {};
      const answers: Record<string, string> = {};

      // Convert UI grid key "r-c" (where c is 6..14) to workflow coordinate "r,c-6"
      for (const [key, letter] of Object.entries(uiGrid)) {
        if (!letter || !letter.trim()) continue;
        const [r, c] = key.split("-").map(Number);
        const workflowCol = c - 6;
        if (workflowCol >= 0 && workflowCol <= 8) {
          answers[`${r},${workflowCol}`] = letter.trim().toUpperCase();
        }
      }

      payload.answers = answers;
    } else if (action === "hint") {
      if (body?.clueId) {
        payload.clue_id = body.clueId;
      }
    }

    const endpointUrl = new URL(COGITX_API_URL);
    endpointUrl.searchParams.set("waitSeconds", COGITX_WAIT_SECONDS);

    const cogitxRes = await fetch(endpointUrl.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": COGITX_CLIENT_ID,
        "x-client-secret": COGITX_CLIENT_SECRET,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (!cogitxRes.ok) {
      const errText = await cogitxRes.text();
      return NextResponse.json(
        {
          success: false,
          error: "CogitX API request failed",
          details: errText,
        },
        { status: cogitxRes.status }
      );
    }

    let responseData = await cogitxRes.json();

    // If job is still running asynchronously, poll until complete
    if (!responseData?.data?.isCompleted && responseData?.data?.jobId) {
      const polled = await pollJobUntilDone(responseData.data.jobId);
      if (polled) {
        responseData = polled;
      }
    }

    const variables = responseData?.data?.output?.variables || {};
    const aiMessage =
      variables?.text ||
      variables?.result?.message ||
      responseData?.data?.output?.node_json_output?.result?.message ||
      "Workflow executed successfully.";

    let decodedResult: any = null;
    const b64 =
      variables?.result_b64 ||
      variables?.result?.result_b64 ||
      responseData?.data?.output?.node_json_output?.result?.result_b64;

    if (b64) {
      try {
        const decodedStr = Buffer.from(b64, "base64").toString("utf-8");
        decodedResult = JSON.parse(decodedStr);
      } catch (err) {
        console.error("Failed to decode result_b64:", err);
      }
    }

    if (action === "submit") {
      // Map cell_status keys from "r,c" (0..8) back to UI "r-c" (6..14)
      const mappedCellStatus: Record<string, string> = {};
      if (decodedResult?.cell_status) {
        for (const [coord, status] of Object.entries(decodedResult.cell_status)) {
          const [rStr, cStr] = coord.split(",");
          const r = parseInt(rStr, 10);
          const c = parseInt(cStr, 10);
          mappedCellStatus[`${r}-${c + 6}`] = status as string;
        }
      }

      return NextResponse.json({
        success: true,
        action: "submit",
        aiMessage,
        wordsCorrect: decodedResult?.words_correct ?? 0,
        wordsTotal: decodedResult?.words_total ?? 14,
        allCorrect: decodedResult?.all_correct ?? false,
        trophy: decodedResult?.trophy ?? false,
        words: decodedResult?.words ?? {},
        cellStatus: mappedCellStatus,
        sparkWord: decodedResult?.spark_word || "SPARK",
      });
    }

    if (action === "hint") {
      let hintData = null;
      if (decodedResult && decodedResult.row !== undefined) {
        hintData = {
          key: `${decodedResult.row}-${decodedResult.col + 6}`,
          row: decodedResult.row,
          col: decodedResult.col + 6,
          letter: decodedResult.letter,
          hintsUsed: decodedResult.hints_used ?? 1,
          hintsLeft: decodedResult.hints_left ?? 0,
        };
      }

      return NextResponse.json({
        success: true,
        action: "hint",
        aiMessage,
        hint: hintData,
      });
    }

    return NextResponse.json({
      success: true,
      action,
      aiMessage,
      data: decodedResult,
    });
  } catch (error: any) {
    console.error("Crossword API Route Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}

