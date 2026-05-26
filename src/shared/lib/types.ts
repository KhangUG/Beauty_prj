import type { MakeupEffect } from "@/features/ai-scan/types/makeup-vto";

export type SkinMetric = {
  label: string;
  value: number;
  status: "great" | "moderate" | "attention";
};

export type ScanResult = {
  originalImage: string;
  appliedEffects: MakeupEffect[];
  resultImageUrl: string;
  createdAt: string;
  mode: "demo" | "api";
};

export type ProductRecommendation = {
  id: string;
  name: string;
  image: string;
  description: string;
  reason: string;
  externalLink: string;
  category: string;
  price?: string;
  originalPrice?: string;
  discount?: number; // percent
  rating?: number;
  reviews?: number;
  stock?: number;
  matchScore?: number;
  matchReason?: string;
};

export type OrderRecord = {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  productCategory: string;
  quantity: number;
  price: number;
  totalPrice: number;
  paymentMethod: "cod" | "momo" | "visa" | "apple";
  shippingInfo: {
    name: string;
    phone: string;
    address: string;
  };
  status: "pending" | "completed" | "canceled";
  createdAt: string;
};
