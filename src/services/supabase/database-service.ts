import { supabase, type Json } from "@/services/supabase/client";
import { type ScanResult, type OrderRecord } from "@/shared/lib/types";
import {
  getSubscriptionTier,
  setSubscriptionTier,
} from "@/shared/lib/subscription";
import { storageService } from "./storage-service";

type SaveRecommendationInput = {
  productId: string;
  reason?: string;
};

export type AdminProductRecord = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  external_url: string | null;
  brand: string | null;
  category_id: string;
  created_at: string;
};

type AdminApiKeyRecord = {
  id: string
  name: string | null;
  key_value: string | null;
  provider: string | null;
  is_active: boolean
  created_at: string
}

export type AdminScanRecord = {
  id: string;
  created_at: string;
  user_id: string;
  original_image: string | null;
  image_url: string | null;
  effects: any[];
  mode: "api" | "demo";
};

export type AdminRecommendationRecord = {
  id: string;
  scan_id: string;
  product_id: string;
  reason: string;
  created_at: string;
};

export type AdminCategoryRecord = {
  id: string;
  name: string;
  api_category_key: string;
  created_at: string;
};

export type AdminProductConfigRecord = {
  id: string;
  product_id: string;
  hex_color: string | null;
  texture: string | null;
  color_intensity: number | null;
  pattern_name: string | null;
  extra_params: Json | null;
  created_at: string;
};

export type AdminUserProfileRecord = {
  id: string;
  email: string;
  role: string;
  subscription_tier: string;
  updated_at: string;
  created_at: string;
};

type CreateProductInput = Omit<AdminProductRecord, "id" | "created_at">;

type CreateApiKeyInput = Omit<AdminApiKeyRecord, "id" | "created_at">;

type UpdateProductInput = Partial<CreateProductInput>;

type UpdateApiKeyInput = Partial<CreateApiKeyInput>;

type CreateRecommendationInput = {
  scanId: string;
  productId: string;
  reason: string;
};

export type MakeupCatalogRow = {
  productId: string;
  name: string;
  description: string | null;
  image: string;
  externalLink: string;
  brand: string | null;
  categoryId: string;
  categoryName: string;
  apiCategoryKey: string;
  hexColor: string | null;
  texture: string | null;
  colorIntensity: number | null;
  patternName: string | null;
};

export type Plan = {
  id: string;
  name: string;
  slug: string;
  price: number;
  billing_interval: "month" | "year";
  scan_limit: number;
  history_days: number;
  description: string | null;
  features: string[];
  badge: string | null;
  is_active: boolean;
  created_at: string;
};

export type SubscriptionStatus = "active" | "cancelled" | "expired" | "pending";

export type Subscription = {
  id: string;
  user_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  started_at: string;
  expires_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  plan?: {
    id: string;
    name: string;
    slug: string;
    price: number;
    billing_interval: string;
  };
};

export const databaseService = {
  async getMakeupCatalog(): Promise<MakeupCatalogRow[]> {
    const [
      { data: products, error: productsError },
      { data: categories, error: categoriesError },
      { data: configs, error: configsError },
    ] = await Promise.all([
      supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase.from("categories").select("*"),
      supabase.from("product_configs").select("*"),
    ]);

    if (productsError) throw productsError;
    if (categoriesError) throw categoriesError;
    if (configsError) throw configsError;

    const categoryMap = new Map(
      (categories ?? []).map((category) => [
        category.id,
        category as AdminCategoryRecord,
      ]),
    );
    const configMap = new Map(
      (configs ?? []).map((config) => [
        config.product_id,
        config as AdminProductConfigRecord,
      ]),
    );

    return ((products ?? []) as AdminProductRecord[]).map((product) => {
      const category = categoryMap.get(product.category_id);
      const config = configMap.get(product.id);

      return {
        productId: product.id,
        name: product.name,
        description: product.description,
        image: product.image_url ?? "",
        externalLink: product.external_url ?? "",
        brand: product.brand,
        categoryId: product.category_id,
        categoryName: category?.name ?? "Uncategorized",
        apiCategoryKey: category?.api_category_key ?? "general",
        hexColor: config?.hex_color ?? null,
        texture: config?.texture ?? null,
        colorIntensity: config?.color_intensity ?? null,
        patternName: config?.pattern_name ?? null,
      };
    });
  },

  async getProducts() {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as AdminProductRecord[];
  },

  async getAdminProducts() {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as AdminProductRecord[];
  },

  async getAdminApiKeys() {
    const { data, error } = await supabase
      .from("api_keys")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as AdminApiKeyRecord[];
  },

  async createApiKey(input: CreateApiKeyInput) {
    const { data, error } = await (supabase as any)
      .from("api_keys")
      .insert(input)
      .select("*")
      .single();
    if (error) throw error;
    return data as AdminApiKeyRecord;
  },

  async updateApiKey(id: string, input: UpdateApiKeyInput) {
    const { data, error } = await (supabase as any)
      .from('api_keys')
      .update(input)
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    return data as AdminApiKeyRecord
  },

  async deleteApiKey(id: string) {
    const { error } = await supabase.from("api_keys").delete().eq("id", id);
    if (error) throw error;
  },

  async createProduct(input: CreateProductInput) {
    const { data, error } = await supabase
      .from("products")
      .insert(input)
      .select("*")
      .single();
    if (error) throw error;
    return data as AdminProductRecord;
  },

  async updateProduct(id: string, input: UpdateProductInput) {
    const { data, error } = await supabase
      .from("products")
      .update(input)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return data as AdminProductRecord;
  },

  async deleteProduct(id: string) {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) throw error;
  },

  async getAdminCategories() {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as AdminCategoryRecord[];
  },

  async createCategory(input: Omit<AdminCategoryRecord, "id" | "created_at">) {
    const { data, error } = await supabase
      .from("categories")
      .insert(input)
      .select("*")
      .single();
    if (error) throw error;
    return data as AdminCategoryRecord;
  },

  async updateCategory(
    id: string,
    input: Partial<Omit<AdminCategoryRecord, "id" | "created_at">>,
  ) {
    const { data, error } = await supabase
      .from("categories")
      .update(input)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return data as AdminCategoryRecord;
  },

  async deleteCategory(id: string) {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) throw error;
  },

  async getAdminProductConfigs() {
    const { data, error } = await supabase
      .from("product_configs")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as AdminProductConfigRecord[];
  },

  async getCategories() {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as AdminCategoryRecord[];
  },

  async createProductConfig(
    input: Omit<AdminProductConfigRecord, "id" | "created_at">,
  ) {
    const { data, error } = await supabase
      .from("product_configs")
      .insert(input)
      .select("*")
      .single();
    if (error) throw error;
    return data as AdminProductConfigRecord;
  },

  async updateProductConfig(
    id: string,
    input: Partial<Omit<AdminProductConfigRecord, "id" | "created_at">>,
  ) {
    const { data, error } = await supabase
      .from("product_configs")
      .update(input)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return data as AdminProductConfigRecord;
  },

  async deleteProductConfig(id: string) {
    const { error } = await supabase
      .from("product_configs")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },

  async getScanHistory(userId: string) {
    const { data, error } = await supabase
      .from("scans")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data ?? [];
  },

  async getScanCountThisMonth(userId: string) {
    const startOfMonth = new Date(
      Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1),
    ).toISOString();
    const { data, error } = await supabase
      .from("scans")
      .select("id")
      .eq("user_id", userId)
      .gte("created_at", startOfMonth);

    if (error) throw error;
    return (data ?? []).length;
  },

  async getProfiles() {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, role, subscription_tier, updated_at")
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async getAdminScans() {
    const { data, error } = await supabase
      .from("scans")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Supabase Error:", error);
      throw error;
    }
    return (data ?? []) as AdminScanRecord[];
  },

  async deleteScan(id: string) {
    const { error } = await supabase.from("scans").delete().eq("id", id);
    if (error) throw error;
  },

  async saveScan(userId: string, scanResult: ScanResult) {
    const { data, error: insertError } = await supabase
      .from("scans")
      .insert({
        user_id: userId,
        original_image: scanResult.originalImage, // dùng thẳng, không upload lại
        image_url: null,
        effects: scanResult.appliedEffects.filter(
          (e) => e.enabled,
        ) as unknown as Json,
        mode: scanResult.mode,
      } as any)
      .select("id")
      .single();

    if (insertError) throw insertError;
    const scanId = data.id;

    const storedResultUrl = await storageService.uploadMakeupResult(
      userId,
      scanResult.resultImageUrl,
      scanId,
    );

    const { error: updateError } = await supabase
      .from("scans")
      .update({ image_url: storedResultUrl })
      .eq("id", scanId);

    if (updateError) throw updateError;
    return scanId;
  },

  async saveRecommendations(scanId: string, items: SaveRecommendationInput[]) {
    if (items.length === 0) return;

    const { error } = await supabase.from("recommendations").insert(
      items.map((item) => ({
        scan_id: scanId,
        product_id: item.productId,
        reason: item.reason ?? "",
      })) as any,
    );

    if (error) throw error;
  },

  async getAdminRecommendations() {
    const { data, error } = await supabase
      .from("recommendations")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as AdminRecommendationRecord[];
  },

  async getUsersWithRoles() {
    try {
      const profiles = await this.getProfiles();
      const stored = localStorage.getItem("lumina_user_roles");
      let localOverrides: Array<{
        id: string;
        email: string;
        role: string;
        created_at: string;
      }> = [];

      if (stored) {
        try {
          localOverrides = JSON.parse(stored) as Array<{
            id: string;
            email: string;
            role: string;
            created_at: string;
          }>;
        } catch {
          localOverrides = [];
        }
      }

      const mapped = profiles.map((profile) => {
        const local = localOverrides.find(
          (u) => u.email.toLowerCase() === profile.email.toLowerCase(),
        );
        return {
          ...profile,
          role: local?.role ?? profile.role,
          created_at: profile.updated_at,
        };
      });

      if (mapped.length > 0) {
        return mapped;
      }
    } catch {
      // fallback to local storage when Supabase is not available
    }

    const stored = localStorage.getItem("lumina_user_roles");
    if (stored) {
      try {
        const users = JSON.parse(stored) as Array<{
          id: string;
          email: string;
          role: string;
          created_at: string;
        }>;
        return users.map((user) => ({
          ...user,
          role: user.role === "admin" ? "admin" : "user",
          subscription_tier: getSubscriptionTier(user.id) ?? "free",
          created_at: user.created_at,
        }));
      } catch {
        // ignore
      }
    }

    const defaultUsers = [
      {
        id: "u1",
        email: "admin@lumina.ai",
        role: "admin",
        created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
      },
      {
        id: "u6",
        email: "guest-customer@gmail.com",
        role: "user",
        created_at: new Date().toISOString(),
      },
    ];
    localStorage.setItem("lumina_user_roles", JSON.stringify(defaultUsers));
    defaultUsers.forEach((user) => setSubscriptionTier(user.id, "free"));
    return defaultUsers.map((user) => ({ ...user, subscription_tier: "free" }));
  },

  async updateUserRole(userId: string, role: string) {
    try {
      const payload = {
        role,
        updated_at: new Date().toISOString(),
      };
      const { data, error } = await supabase
        .from("profiles")
        .update(payload)
        .eq("id", userId)
        .select("id, email, role, subscription_tier, updated_at")
        .single();

      if (error) throw error;
      return [{ ...data, created_at: data.updated_at }];
    } catch {
      const users = await this.getUsersWithRoles();
      const updated = users.map((u: any) =>
        u.id === userId ? { ...u, role } : u,
      );
      localStorage.setItem("lumina_user_roles", JSON.stringify(updated));
      return updated;
    }
  },

  async updateUserSubscriptionTier(userId: string, subscriptionTier: string) {
    const payload = {
      subscription_tier: subscriptionTier,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from("profiles")
      .update(payload)
      .eq("id", userId)
      .select("id, email, role, subscription_tier, updated_at")
      .single();

    if (error) throw error;
    return {
      ...data,
      created_at: data.updated_at,
    };
  },

  async createUserWithRole(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    role: 'admin' | 'user',
    planId: string = '',
  ) {
    const { data, error } = await supabase.functions.invoke('create-user', {
      body: { email, firstName, lastName, password, role, planId: planId || null },
    })

    if (error) throw new Error(error.message)
    if (data?.error) throw new Error(data.error)

    return data
  },

  async deleteUserRole(userId: string) {
    const { data, error } = await supabase.functions.invoke('delete-user', {
      body: { userId },
    })

    if (error) throw new Error(error.message)
    if (data?.error) throw new Error(data.error)
    return data
  },

  getOrders(): OrderRecord[] {
    const stored = localStorage.getItem("lumina_orders");
    if (stored) {
      try {
        return JSON.parse(stored) as OrderRecord[];
      } catch {
        // ignore
      }
    }
    return this.seedOrders();
  },

  createOrder(order: OrderRecord): OrderRecord {
    const orders = this.getOrders();
    const updated = [order, ...orders];
    localStorage.setItem("lumina_orders", JSON.stringify(updated));
    return order;
  },

  deleteOrder(orderId: string): OrderRecord[] {
    const orders = this.getOrders();
    const updated = orders.filter((o) => o.id !== orderId);
    localStorage.setItem("lumina_orders", JSON.stringify(updated));
    return updated;
  },

  updateOrderStatus(
    orderId: string,
    status: "pending" | "completed" | "canceled",
  ): OrderRecord[] {
    const orders = this.getOrders();
    const updated = orders.map((o) =>
      o.id === orderId ? { ...o, status } : o,
    );
    localStorage.setItem("lumina_orders", JSON.stringify(updated));
    return updated;
  },

  seedOrders(): OrderRecord[] {
    const products = [
      {
        id: "p1",
        name: "La Roche-Posay Hyalu B5 Serum",
        category: "Serum",
        price: 390000,
        image:
          "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "p2",
        name: "CeraVe Moisturising Cream",
        category: "Moisturizer",
        price: 490000,
        image:
          "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "p3",
        name: "Paula's Choice 2% BHA Liquid Exfoliant",
        category: "Toner",
        price: 590000,
        image:
          "https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "p4",
        name: "Cetaphil Gentle Skin Cleanser",
        category: "Cleanser",
        price: 290000,
        image:
          "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=400&q=80",
      },
    ];

    const firstNames = [
      "John",
      "Jane",
      "Michael",
      "Emily",
      "Chris",
      "Sarah",
      "David",
      "Jessica",
      "Daniel",
    ];
    const middleNames = ["A.", "B.", "M.", "E.", "J.", "L.", "D.", "S.", "R."];
    const lastNames = [
      "Smith",
      "Johnson",
      "Williams",
      "Brown",
      "Jones",
      "Garcia",
      "Miller",
      "Davis",
      "Rodriguez",
    ];

    const cities = [
      "New York",
      "Los Angeles",
      "Chicago",
      "Houston",
      "Phoenix",
      "Philadelphia",
    ];

    const orders: OrderRecord[] = [];

    for (let i = 0; i < 24; i++) {
      const prod = products[Math.floor(Math.random() * products.length)];
      const quantity = Math.floor(Math.random() * 2) + 1;
      const price = prod.price;
      const totalPrice = price * quantity;
      const firstName =
        firstNames[Math.floor(Math.random() * firstNames.length)];
      const middleName =
        middleNames[Math.floor(Math.random() * middleNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const name = `${firstName} ${middleName} ${lastName}`;
      const phone = `09${Math.floor(10000000 + Math.random() * 90000000)}`;
      const address = `${Math.floor(Math.random() * 150) + 1} Main St, ${cities[Math.floor(Math.random() * cities.length)]}`;

      const paymentMethods = ["cod", "momo", "visa", "apple"] as const;
      const paymentMethod =
        paymentMethods[Math.floor(Math.random() * paymentMethods.length)];

      const statuses = [
        "completed",
        "completed",
        "completed",
        "pending",
        "canceled",
      ] as const;
      const status = statuses[Math.floor(Math.random() * statuses.length)];

      const daysAgo = Math.floor(Math.random() * 8);
      const date = new Date(
        Date.now() -
          daysAgo * 24 * 3600 * 1000 -
          Math.random() * 12 * 3600 * 1000,
      );

      orders.push({
        id: `BG-${Math.floor(100000 + Math.random() * 900000)}`,
        productId: prod.id,
        productName: prod.name,
        productImage: prod.image,
        productCategory: prod.category,
        quantity,
        price,
        totalPrice,
        paymentMethod,
        shippingInfo: { name, phone, address },
        status,
        createdAt: date.toISOString(),
      });
    }

    orders.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    localStorage.setItem("lumina_orders", JSON.stringify(orders));
    return orders;
  },

  async getPlans() {
    const { data, error } = await supabase
      .from("plans")
      .select("*")
      .order("price", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Plan[];
  },

  // database-service.ts
  async createPlan(plan: any) {
    const { data, error } = await (supabase as any)
      .from("plans")
      .insert(plan)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updatePlan(id: string, patch: any) {
    const { data, error } = await (supabase as any)
      .from("plans")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deletePlan(id: string) {
    const { error } = await (supabase as any)
      .from("plans")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },

  async getSubscriptions() {
    const { data, error } = await (supabase as any)
      .from("subscriptions")
      .select(
        `
      *,
      plan:plans(id, name, slug, price, billing_interval)
    `,
      )
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Subscription[];
  },

  async createSubscription(input: {
    user_id: string;
    plan_id: string;
    status: SubscriptionStatus;
    started_at: string;
    expires_at: string | null;
  }) {
    const { data, error } = await (supabase as any)
      .from("subscriptions")
      .insert(input)
      .select()
      .single();
    if (error) throw error;
    return data as Subscription;
  },

  async updateSubscription(id: string, patch: any) {
    const { data, error } = await (supabase as any)
      .from("subscriptions")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as Subscription;
  },

  async cancelSubscription(id: string) {
    return this.updateSubscription(id, {
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
    });
  },
};
