import type { Database } from "@/integrations/supabase/types";

export type PackageStatus =
  | "pending"
  | "assigned"
  | "picked_up"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export type DriverStatus = "available" | "busy" | "offline";

// Fallback types (Supabase types.ts is auto-generated but may not have tables yet)
export type PackageRow = {
  id: string;
  tracking_id: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  sender_name: string;
  sender_phone: string;
  sender_address: string;
  receiver_name: string;
  receiver_phone: string;
  receiver_address: string;
  package_type: string;
  weight_kg: number;
  description: string | null;
  pickup_option: "customer_dropoff" | "driver_pickup";
  pickup_at: string | null;
  estimated_delivery: string | null;
  distance_km: number;
  fee_ngn: number;
  status: PackageStatus;
  driver_id: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
};

export type DriverRow = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  vehicle: string | null;
  plate: string | null;
  status: DriverStatus;
  today_earnings_ngn: number;
  created_at: string;
};

export type PackageEventRow = {
  id: string;
  package_id: string;
  status: PackageStatus;
  note: string | null;
  actor: string | null;
  created_at: string;
};

export type ProofOfDeliveryRow = {
  id: string;
  package_id: string;
  photo_url: string | null;
  signature_data_url: string | null;
  receiver_name: string;
  delivered_at: string;
};

export const STATUS_LABEL: Record<PackageStatus, string> = {
  pending: "Pending",
  assigned: "Assigned",
  picked_up: "Picked Up",
  in_transit: "In Transit",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const STATUS_STEPS: PackageStatus[] = [
  "pending",
  "assigned",
  "picked_up",
  "in_transit",
  "out_for_delivery",
  "delivered",
];

export function formatNaira(n: number) {
  return "₦" + Number(n).toLocaleString("en-NG");
}

export function calculateFee(distanceKm: number, weightKg: number) {
  const base = 1500;
  const perKm = 100;
  const perKg = 150;
  return Math.round(base + distanceKm * perKm + Math.max(0, weightKg - 1) * perKg);
}

// Explicit unused suppression for the auto-generated Database type
export type _Db = Database;
