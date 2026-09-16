import { FastifyRequest, FastifyReply } from "fastify";
import { MemoryStore } from "./store.js";

export type Role = "admin" | "user" | "read-only";

export function requireAuth(store: MemoryStore, allowedRoles?: Role[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const authHeader = request.headers["authorization"];
    const apiKeyHeader = request.headers["x-api-key"] as string | undefined;

    let key = apiKeyHeader;
    if (!key && authHeader && authHeader.startsWith("Bearer ")) {
      key = authHeader.slice(7).trim();
    }

    if (!key) {
      return reply.status(401).send({
        error: "Unauthorized",
        message: "Missing Authorization Bearer token or x-api-key header",
      });
    }

    const keyData = store.validateApiKey(key);
    if (!keyData) {
      return reply.status(401).send({
        error: "Unauthorized",
        message: "Invalid API key or token",
      });
    }

    if (allowedRoles && !allowedRoles.includes(keyData.role)) {
      return reply.status(403).send({
        error: "Forbidden",
        message: `Role '${keyData.role}' is not authorized to access this resource`,
      });
    }

    // Attach user to request
    (request as unknown as { user: { role: Role; name: string } }).user = keyData;
  };
}
