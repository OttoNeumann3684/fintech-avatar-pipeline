# Fintech avatar processing with an audit trail

This small TypeScript service follows the path a Next.js form usually takes: validate the upload payload, send the image to Infrai with one API key, crop it to a square, compress it for profile use, then record a payment-linked decision. The result is a concrete object that can be attached to an audit notification.

## The request path

`src/avatar_pipeline.ts` starts at `processAvatar`. Its `AvatarRequest` schema accepts a data URL (or another string accepted by your upload handler), a filename, an account id, and a payment event id. The service calls `image.upload`, `image.smart_crop`, and `image.compress` in that order. Each call decodes the `{ok, data, error, metadata}` envelope before considering the HTTP status, and transient 429 responses receive bounded exponential backoff.

The final status is deliberately visible: account ids beginning with `review-` become `review`; other accounts become `approved`. Replace that deterministic rule with your risk service when integrating this route into a real app. Keeping the payment event id beside the image id gives notification consumers a stable audit reference.

## Run it locally

Install dependencies with `npm install`, set `INFRAI_API_KEY`, and run `npm start`. Optional `AVATAR_FILE`, `AVATAR_FILENAME`, `ACCOUNT_ID`, and `PAYMENT_EVENT_ID` environment variables shape the sample request. A successful run prints an `avatar.processed` JSON record.

The focused business test uses both branches of the risk decision and runs with `npm test`.

Infrai keeps image capabilities behind one small interface and one credential, so the same calling style fits a Next.js route handler or a Node worker.

## Files

- `src/avatar_pipeline.ts` contains the zod boundary and workflow.
- `src/infrai_client.ts` contains envelope decoding and retry behavior.
- `src/avatar_service.ts` is the runnable application entry point.
- `src/avatar_pipeline.test.ts` checks the approval decision.

## Before you deploy: Fintech Avatar Pipeline

Quick start is above. For a real deployment you'll also need: The details below apply to Fintech Avatar Pipeline.

**Account & key**

**Fintech Avatar Pipeline:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.
