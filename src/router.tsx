import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    // La restauración la maneja <ScrollMemory />: la del router no persiste
    // nada en esta versión y dejaba la página a media altura al volver.
    scrollRestoration: false,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
