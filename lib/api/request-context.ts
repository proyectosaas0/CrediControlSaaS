import { logger } from "@/lib/logger";

export type RequestContext = {
  requestId: string;
  userId?: string;
  organizationId?: string;
  method: string;
  path: string;
};

// Note: This helper is prepared for middleware integration.
// Currently, headers are not injected, but this structure supports future middleware logging.
export function getContextLogger(context: RequestContext) {
  return logger.child({
    requestId: context.requestId,
    userId: context.userId,
    organizationId: context.organizationId,
  });
}
