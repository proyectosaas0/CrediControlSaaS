import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export type TransactionCallback<T> = (
  client: Awaited<ReturnType<typeof createClient>>
) => Promise<T>;

export async function withTransaction<T>(
  callback: TransactionCallback<T>,
  context?: { userId?: string; organizationId?: string }
) {
  const supabase = await createClient();
  const transactionId = Math.random().toString(36).substring(7);

  logger.debug(
    { transactionId, ...context },
    "Starting transaction"
  );

  try {
    const result = await callback(supabase);
    logger.debug({ transactionId }, "Transaction committed");
    return result;
  } catch (error) {
    logger.error(
      { transactionId, error: String(error) },
      "Transaction failed"
    );
    throw error;
  }
}
