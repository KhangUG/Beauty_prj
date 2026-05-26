import { type ScanResult } from "@/shared/lib/types";
import { databaseService } from "@/services/supabase/database-service";
import { env } from "@/config/env";
import { matchProductsToEffects } from '@/features/ai-scan/lib/makeup-product-matcher';

function makeId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function persistScan(userId: string, result: ScanResult) {
  const catalog = await databaseService.getMakeupCatalog().catch(() => []);
  const matched = matchProductsToEffects(result.appliedEffects, catalog);

  // Dev-only fallback: allow saving scans locally when no authenticated user
  if ((!userId || userId === "") && env.allowGuestScans) {
    const id = makeId();
    const now = new Date().toISOString();

    const recommendations = matched.map((product) => ({
      id: makeId(),
      productId: product.productId,
      reason: product.matchReason,
    }));

    const scan = { id, userId: null, result, created_at: now, recommendations };
    const existing = JSON.parse(localStorage.getItem("guest_scans") || "[]");
    existing.unshift(scan);
    localStorage.setItem("guest_scans", JSON.stringify(existing));
    return id;
  }

  const scanId = await databaseService.saveScan(userId, result);

  if (matched.length > 0) {
    await databaseService.saveRecommendations(
      scanId,
      matched.map((product) => ({
        productId: product.productId,
        reason: product.matchReason,
      })),
    );
  }

  return scanId;
}
