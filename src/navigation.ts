import {
  LayoutDashboard,
  Smartphone,
  ShoppingCart,
  Store,
  Warehouse,
  Package,
  Truck,
  IndianRupee,
} from "lucide-react";
import type { NavItem } from "@/components/app-shell";

/**
 * Information architecture of the unified management dashboard — one tab
 * per company-wide data domain, spanning ONDC seller network + Qwipo 2.0.
 */
export const navigation: NavItem[] = [
  { name: "Overview", href: "/", icon: LayoutDashboard },
  { name: "App analytics", href: "/apps", icon: Smartphone },
  { name: "Orders", href: "/orders", icon: ShoppingCart },
  { name: "Retailers", href: "/retailers", icon: Store },
  { name: "Vendors", href: "/vendors", icon: Warehouse },
  { name: "SKUs", href: "/skus", icon: Package },
  { name: "Logistics", href: "/logistics", icon: Truck },
  { name: "Sales & revenue", href: "/sales", icon: IndianRupee },
];
