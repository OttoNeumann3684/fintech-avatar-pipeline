import { processAvatar } from "./avatar_pipeline.ts";

const input = {
  file: process.env.AVATAR_FILE ?? "data:image/png;base64,avatar",
  filename: process.env.AVATAR_FILENAME ?? "avatar.png",
  accountId: process.env.ACCOUNT_ID ?? "acct-demo",
  paymentEventId: process.env.PAYMENT_EVENT_ID ?? "pay-demo-001"
};

const result = await processAvatar(input);
console.log(JSON.stringify({ event: "avatar.processed", audit: result }, null, 2));
