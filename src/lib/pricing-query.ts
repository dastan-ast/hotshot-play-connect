import { queryOptions } from "@tanstack/react-query";
import { listPricing } from "./pricing.functions";

export const pricingQuery = queryOptions({
  queryKey: ["subscription-pricing"], queryFn: () => listPricing(),
  staleTime: 0, refetchInterval: 60000, refetchOnWindowFocus: true,
});