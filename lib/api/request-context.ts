import { headers } from "next/headers";
import { v4 as uuidv4 } from "uuid";
import { logger } from "@/lib/logger";

export type RequestContext = {
  requestId: string;
  userId?: string;
  organizationId?: string;
  method: string;
  path: string;
};

const requestContextKey = Symbol("requestContext");

export async function getRequestContext(): Promise<RequestContext> {
  const headersList = await headers();
  const requestId = headersList.get("x-request-id") || uuidv4();
  const method = headersList.get("x-method") || "GET";
  const path = headersList.get("x-path") || "/";

  return {
    requestId,
    method,
    path,
  };
}

export function getContextLogger(context: RequestContext) {
  return logger.child({
    requestId: context.requestId,
    userId: context.userId,
    organizationId: context.organizationId,
  });
}
