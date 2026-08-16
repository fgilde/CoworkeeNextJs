import Link from "next/link";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { requireAuth } from "@/lib/rbac";
import { spec } from "@/app/api/v1/openapi.json/route";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

const METHODS = ["get", "post", "patch", "put", "delete"] as const;

type Endpoint = { method: string; path: string; summary: string };

function endpointsByTag(): Map<string, Endpoint[]> {
  const groups = new Map<string, Endpoint[]>();
  for (const [path, ops] of Object.entries(spec.paths as Record<string, Record<string, { tags?: string[]; summary?: string }>>)) {
    for (const method of METHODS) {
      const op = ops[method];
      if (!op) continue;
      const tag = op.tags?.[0] ?? "General";
      const list = groups.get(tag) ?? [];
      list.push({ method: method.toUpperCase(), path, summary: op.summary ?? "" });
      groups.set(tag, list);
    }
  }
  return groups;
}

const METHOD_COLOR: Record<string, string> = {
  GET: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  POST: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  PATCH: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  PUT: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  DELETE: "bg-red-500/15 text-red-600 dark:text-red-400",
};

function Code({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-xs leading-relaxed">
      <code>{children}</code>
    </pre>
  );
}

export default async function ApiReferencePage() {
  await requireAuth();
  const t = await getTranslations("apiDocs");

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "your-host";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  const base = `${proto}://${host}`;

  const groups = endpointsByTag();

  const mcpConfig = `{
  "mcpServers": {
    "coworkee": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "${base}/api/mcp",
        "--header",
        "Authorization: Bearer YOUR_TOKEN"
      ]
    }
  }
}`;

  const curlRest = `curl -H "Authorization: Bearer YOUR_TOKEN" \\
  ${base}/api/v1/employees`;

  const curlMcp = `curl -X POST ${base}/api/mcp \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'`;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("gettingStarted")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-sm">
          <p className="text-muted-foreground">{t("tokenHelp")}</p>
          <Link href="/account" className={buttonVariants({ variant: "outline", size: "sm" }) + " self-start"}>
            {t("manageTokens")}
          </Link>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border p-3">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">{t("restBaseUrl")}</div>
              <code className="text-sm">{base}/api/v1</code>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">{t("mcpEndpoint")}</div>
              <code className="text-sm">{base}/api/mcp</code>
            </div>
          </div>
          <p className="text-muted-foreground">{t("rbacNote")}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("mcpTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-sm">
          <p className="text-muted-foreground">{t("mcpHelp")}</p>
          <div>
            <div className="mb-1 font-medium">{t("mcpConfigTitle")}</div>
            <Code>{mcpConfig}</Code>
          </div>
          <div>
            <div className="mb-1 font-medium">{t("mcpProbeTitle")}</div>
            <Code>{curlMcp}</Code>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("restTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-sm">
          <p className="text-muted-foreground">{t("restHelp")}</p>
          <Code>{curlRest}</Code>
          <div className="flex flex-col gap-5">
            {[...groups.entries()].map(([tag, endpoints]) => (
              <div key={tag}>
                <h3 className="mb-2 text-sm font-semibold">{tag}</h3>
                <div className="flex flex-col divide-y rounded-lg border">
                  {endpoints.map((e) => (
                    <div key={e.method + e.path} className="flex flex-col gap-1 px-3 py-2 sm:flex-row sm:items-center sm:gap-3">
                      <span className={`inline-block w-fit rounded px-2 py-0.5 font-mono text-xs font-semibold ${METHOD_COLOR[e.method] ?? "bg-muted"}`}>
                        {e.method}
                      </span>
                      <code className="text-xs">{e.path}</code>
                      <span className="text-xs text-muted-foreground sm:ml-auto sm:text-right">{e.summary}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <Link href="/api/v1/openapi.json" className="text-xs text-primary underline underline-offset-2" prefetch={false}>
            {t("openapiLink")}
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
