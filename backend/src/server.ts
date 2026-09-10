import { existsSync } from "node:fs";
import fastifyStatic from "@fastify/static";
import Fastify from "fastify";
import { CommandError, problemCommandSchema } from "shared";
import { problemsDir, publicDir } from "./paths.ts";
import { loadProblems } from "./problems/load.ts";
import { Db } from "./store/db.ts";
import { EventStore } from "./store/events.ts";

export type ServeOptions = {
  port: number;
  host: string;
};

export async function buildServer() {
  const store = new EventStore(Db.open());
  const app = Fastify({ logger: true });

  // Problem content is loaded fresh on every request, so file edits appear immediately.
  app.get("/api/problems", async () => {
    const { errors, problems } = await loadProblems([problemsDir]);
    if (errors.length > 0) {
      throw new AggregateError(errors);
    }
    return problems;
  });

  app.get("/api/events", async () => store.events());

  app.post("/api/problem-commands", async (request, reply) => {
    const parsed = problemCommandSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "invalid command payload" });
    }
    try {
      const result = await store.processCommand(parsed.data);
      return reply.code(result.outcome === "appended" ? 201 : 200).send(result);
    } catch (err) {
      if (err instanceof CommandError) {
        return reply.code(err.code === "conflict" ? 409 : 400).send({ error: err.message });
      }
      throw err;
    }
  });

  const serveFrontend = existsSync(publicDir);
  if (serveFrontend) {
    app.register(fastifyStatic, {
      root: publicDir,
      wildcard: false,
    });
  } else {
    app.log.warn(
      `frontend build not found at ${publicDir} — run "npm run build:frontend" from the repo root to serve it; API-only for now.`,
    );
  }

  app.setNotFoundHandler(async (request, reply) => {
    if (serveFrontend && request.raw.method === "GET" && !request.url.startsWith("/api/")) {
      return reply.sendFile("index.html");
    }
    return reply.code(404).send({ error: "not found" });
  });

  return app;
}

export async function serve(options: ServeOptions) {
  const app = await buildServer();

  for (const signal of ["SIGTERM", "SIGINT"] as const) {
    process.on(signal, () => {
      app.close().finally(() => process.exit(0));
    });
  }

  try {
    await app.listen({ port: options.port, host: options.host });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
  return app;
}
