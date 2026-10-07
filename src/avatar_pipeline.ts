import { z } from "zod";
import { infraiRequest } from "./infrai_client.ts";

export const AvatarRequest = z.object({
  file: z.string().min(1),
  filename: z.string().min(1),
  accountId: z.string().min(1),
  paymentEventId: z.string().min(1)
});
export type AvatarInput = z.infer<typeof AvatarRequest>;

export type AvatarResult = { accountId: string; paymentEventId: string; imageId: string; status: "approved" | "review" };

export function riskDecision(accountId: string, paymentEventId: string, imageId: string): AvatarResult {
  const status = accountId.startsWith("review-") ? "review" : "approved";
  return { accountId, paymentEventId, imageId, status };
}

export async function processAvatar(input: unknown): Promise<AvatarResult> {
  const request = AvatarRequest.parse(input);
  const uploaded = await infraiRequest<{ image_id: string }>("/v1/image/upload", { file: request.file, filename: request.filename });
  let cropped: { image_id: string };
  try {
    cropped = await infraiRequest<{ image_id: string }>("/v1/image/smart_crop", { image: { image_id: uploaded.image_id }, aspect: "1:1" });
  } catch (error) {
    try {
      await infraiRequest(`/v1/image/delete/${encodeURIComponent(uploaded.image_id)}`, {}, "DELETE");
    } catch (cleanupError) {
      throw new AggregateError([error, cleanupError], `Smart crop failed; uploaded image ${uploaded.image_id} could not be deleted`);
    }
    throw error;
  }
  const optimized = await infraiRequest<{ image_id: string }>("/v1/image/compress", { image: { image_id: cropped.image_id }, format: "webp" });
  return riskDecision(request.accountId, request.paymentEventId, optimized.image_id);
}
