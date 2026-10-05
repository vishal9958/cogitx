# CogitX Travel Chatbot

A simple Next.js chatbot UI connected to a CogitX Workflow through the REST API.

## 1. Install

```bash
npm install
```

## 2. Configure credentials

Copy `.env.example` to `.env.local`.

```env
COGITX_API_URL=https://platform.cogitx.ai/exports/rest-api/YOUR_WORKFLOW_ID/jobs
COGITX_CLIENT_ID=YOUR_CLIENT_ID
COGITX_CLIENT_SECRET=YOUR_CLIENT_SECRET
COGITX_WAIT_SECONDS=30
```

Use the exact endpoint shown in CogitX:

**Workflow → Export → API Playground → Documentation → Text Input**

The documentation shown for the workflow uses:

- `POST /exports/rest-api/{workflowId}/jobs`
- `x-client-id`
- `x-client-secret`
- JSON body: `{ "text": "..." }`
- optional `waitSeconds`

Do not put the client secret in frontend code.

## 3. Run

```bash
npm run dev
```

Open:

http://localhost:3000

## 4. Workflow-side mapping

The CogitX workflow should be:

```text
Text Input → AI Agent → Text Output
```

The AI Agent input should receive the Text Input value, and its generated text should flow to Text Output. In the platform UI, use the variables shown by the workflow variable picker (the video uses `{{node.agent.input}}` for the agent input and `{{node.agent.text}}` for the agent text output).

## Troubleshooting

If the UI says that no output was returned, first test the exact same request in CogitX API Playground. If the Playground succeeds but the app fails, compare the endpoint, headers, body and `waitSeconds` value.

If CogitX returns `accepted: true` with `isCompleted: false`, the workflow did not finish within the requested wait window. Increase `COGITX_WAIT_SECONDS` and retry. This starter does not invent a polling endpoint that is not shown in the provided documentation.
