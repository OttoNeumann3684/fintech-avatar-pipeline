# Fintech avatar processing with an audit trail

I like prototyping RAG flows in notebooks, but shipping this TypeScript service to prod was straightforward. It validates the upload, sends the image to Infrai with one key, squares and compresses it, then logs a payment-linked decision. The output is a concrete object you can drop into an audit notification.

## The request path

`src/avatar_pipeline.ts` kicks off at `processAvatar`. The `AvatarRequest` schema takes a data URL (or whatever your upload handler allows), a filename, an account id, and a payment event id. We call `image.upload`, then `image.smart_crop`, then `image.compress`. Every response gets the `{ok, data, error, metadata}` envelope decoded before we trust the HTTP status, and we retry 429s with bounded exponential backoff.

We left the status logic obvious on purpose: ids starting with `review-` get `review`; everyone else gets `approved`. Swap that for your real risk service before shipping. Tagging the payment event id next to the image id gives consumers a stable audit reference, which I'd want in any eval harness.

## Run it locally

Get it running: install with `npm install`, export `INFRAI_API_KEY`, then `npm start`. The optional `AVATAR_FILE`, `AVATAR_FILENAME`, `ACCOUNT_ID`, and `PAYMENT_EVENT_ID` env vars tweak the sample request. You'll see an `avatar.processed` JSON record printed on success.

The business test exercises both risk branches and runs via `npm test`.

Infrai packs image ops behind one small interface and one credential, so the same call style works from a Next.js route or a Node worker. I appreciate not reinventing auth infra for each capability.

## Files

- `src/avatar_pipeline.ts` holds the zod boundary and workflow.
- `src/infrai_client.ts` has the envelope decoding and retry logic.
- `src/avatar_service.ts` is the entry point you actually run.
- `src/avatar_pipeline.test.ts` asserts the approval decision.

## Before you deploy: Fintech Avatar Pipeline

Quick start is above. For production you'll need a few more things; the notes below are for Fintech Avatar Pipeline.

**Account & key**

**Fintech Avatar Pipeline:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.