import { existsSync, realpathSync } from "node:fs";
import path from "node:path";
import fastifyStatic from "@fastify/static";
import Fastify from "fastify";
import { CommandError, problemCommandSchema } from "shared";
import { problemsDir, publicDir } from "./paths.ts";
import { assetsPrefix } from "./problems/images.ts";
import { loadProblems } from "./problems/load.ts";
import { Db } from "./store/db.ts";
import { EventStore } from "./store/events.ts";

export type ServeOptions = {
  port: number;
  host: string;
};

export async function buildServer(contentDir = problemsDir) {
  const store = new EventStore(Db.open());
  const app = Fastify({ logger: true });

  // Problem content is loaded fresh on every request, so file edits appear immediately.
  app.get("/api/problems", async () => {
    const { errors, problems } = await loadProblems(contentDir);
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

  app.register(fastifyStatic, {
    root: contentDir,
    prefix: assetsPrefix,
    decorateReply: false,
    allowedPath: (pathname, root) => {
      if (!/\.(?:svg|png|jpg)$/i.test(pathname)) {
        return false;
      }
      try {
        const relative = path.relative(realpathSync(root), realpathSync(path.join(root, pathname)));
        return relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
      } catch {
        return false;
      }
    },
    setHeaders: (response, file) => {
      response.header("X-Content-Type-Options", "nosniff");
      if (/\.svg$/i.test(file)) {
        response.header("Content-Security-Policy", "sandbox");
      }
    },
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
