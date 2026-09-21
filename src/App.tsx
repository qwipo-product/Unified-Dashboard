import { createBrowserRouter, RouterProvider, useNavigate } from "react-router";
import { AppShell } from "@/components/app-shell";
import { navigation } from "@/navigation";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { ProtectedRoute } from "@/lib/protected-route";

// Brand logos ship with the design-system token package.
import logo from "@qwipo/tokens/assets/Qwipo_Secondary_Logo_for_Light_BG@4x-8.png";
import logoIcon from "@qwipo/tokens/assets/Qwipo_Icon_Logo_for_Light_BG@4x-8.png";
import logoDark from "@qwipo/tokens/assets/Qwipo_Secondary_Logo_for_Dark_BG.svg";
import logoIconDark from "@qwipo/tokens/assets/Qwipo_Icon_Logo_for_Dark_BG.svg";

import { Login } from "@/pages/login";
import { Overview } from "@/pages/overview";
import { Apps } from "@/pages/apps";
import { Orders } from "@/pages/orders";
import { Retailers } from "@/pages/retailers";
import { Vendors } from "@/pages/vendors";
import { Skus } from "@/pages/skus";
import { Logistics } from "@/pages/logistics";
import { Sales } from "@/pages/sales";

function Shell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const initials = user
    ? user.name
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "QW";

  return (
    <ProtectedRoute>
      <AppShell
        navigation={navigation}
        logo={logo}
        logoIcon={logoIcon}
        logoDark={logoDark}
        logoIconDark={logoIconDark}
        user={{
          name: user?.name ?? "",
          subtitle: user ? `${user.role} · +91 ${user.phone}` : undefined,
          avatarInitials: initials,
        }}
        onLogout={() => {
          logout();
          navigate("/login");
        }}
      />
    </ProtectedRoute>
  );
}

const router = createBrowserRouter([
  { path: "/login", element: <Login /> },
  {
    path: "/",
    element: <Shell />,
    children: [
      { index: true, element: <Overview /> },
      { path: "apps", element: <Apps /> },
      { path: "orders", element: <Orders /> },
      { path: "retailers", element: <Retailers /> },
      { path: "vendors", element: <Vendors /> },
      { path: "skus", element: <Skus /> },
      { path: "logistics", element: <Logistics /> },
      { path: "sales", element: <Sales /> },
    ],
  },
]);

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
