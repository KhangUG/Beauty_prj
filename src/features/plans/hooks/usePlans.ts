import { useEffect, useState } from "react";
import { plansService, type Plan } from "../services/plans-service";

interface UsePlansResult {
  plans: Plan[];
  loading: boolean;
  error: string | null;
}

export function usePlans(): UsePlansResult {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    plansService
      .getActivePlans()
      .then(setPlans)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { plans, loading, error };
}
