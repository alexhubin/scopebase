import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, RouterProvider, createMemoryHistory, createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import { render } from "@testing-library/react";
import type { ComponentType } from "react";
import { vi } from "vitest";

export type FetchResolver = (path: string, init?: RequestInit) => Response | Promise<Response>;

export function renderRoute(path: string, routePath: string, component: ComponentType, resolve: FetchResolver) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const value = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    if (value === "/api/auth/refresh") return json({}, 401);
    return resolve(value.replace(/^\/api/, ""), init);
  });
  vi.stubGlobal("fetch", fetchMock);
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const rootRoute = createRootRoute({ component: () => <QueryClientProvider client={queryClient}><Outlet /></QueryClientProvider> });
  const pageRoute = createRoute({ getParentRoute: () => rootRoute, path: routePath, component });
  const router = createRouter({ routeTree: rootRoute.addChildren([pageRoute]), context: { queryClient }, history: createMemoryHistory({ initialEntries: [path] }) });
  const result = render(<RouterProvider router={router} />);
  return { ...result, fetchMock };
}

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}
