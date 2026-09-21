import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Link, Outlet, useLocation } from "react-router";
import {
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  LogOut,
  Menu,
  X,
  ExternalLink,
  type LucideIcon,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { RouteProgress } from "./ui/page-loader";
import { ThemeToggle } from "./theme-toggle";

/**
 * Qwipo app shell — the canonical sidebar + header + content frame shared by
 * every Qwipo web app. It is a decoupled version of the ONDC Seller Store's
 * RootLayout: all app-specific coupling (auth, roles, hard-coded menus) is
 * lifted out into props, so a new app gets the identical structure, navigation
 * behavior, collapse, mobile drawer, and route-progress with zero divergence.
 *
 * Wire it as a react-router layout route (renders <Outlet />), or pass children.
 */

export type NavSubItem = { name: string; href: string };

export type NavItem = {
  name: string;
  /** Internal route. Omit for `externalUrl` or parent-with-subItems entries. */
  href?: string;
  /** Opens in a new tab instead of routing. */
  externalUrl?: string;
  /** Greys the item out and blocks interaction (e.g. gated features). */
  disabled?: boolean;
  icon: LucideIcon;
  /** Collapsible child links. When present, the item becomes an expander. */
  subItems?: NavSubItem[];
};

export type AppShellUser = {
  name: string;
  /** Second line under the name (business name, role, etc.). */
  subtitle?: string;
  /** 1–2 letters for the avatar circle. */
  avatarInitials?: string;
  /** Tailwind bg class for the avatar circle. Defaults to brand blue. */
  avatarColor?: string;
};

export type AppShellProps = {
  navigation: NavItem[];
  /** Wordmark shown when the sidebar is expanded (light background). */
  logo: string;
  /** Icon mark shown when the sidebar is collapsed (light background). */
  logoIcon: string;
  /** Optional dark-theme variants — falls back to the light ones. */
  logoDark?: string;
  logoIconDark?: string;
  user?: AppShellUser;
  onLogout?: () => void;
  /** Extra items above Logout in the profile menu (Profile, Settings, …). */
  userMenuItems?: { label: string; icon?: LucideIcon; onClick: () => void }[];
  /** Header title for a path. Defaults to the active nav item's name. */
  getPageTitle?: (pathname: string) => string;
  /** Which parent menu starts expanded. */
  defaultExpandedMenu?: string;
  /** Render instead of <Outlet /> when not used as a layout route. */
  children?: ReactNode;
};

export function AppShell({
  navigation,
  logo,
  logoIcon,
  logoDark,
  logoIconDark,
  user,
  onLogout,
  userMenuItems = [],
  getPageTitle,
  defaultExpandedMenu = null as unknown as string,
  children,
}: AppShellProps) {
  const location = useLocation();

  // Theme-aware logo swap, mount-guarded to avoid a first-paint flicker.
  const [themeReady, setThemeReady] = useState(false);
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    setThemeReady(true);
    const root = document.documentElement;
    const sync = () => setIsDark(root.classList.contains("dark"));
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  const useDark = themeReady && isDark;
  const logoSrc = useDark ? logoDark ?? logo : logo;
  const logoIconSrc = useDark ? logoIconDark ?? logoIcon : logoIcon;

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(
    defaultExpandedMenu ?? null,
  );
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/" || href === "/admin") return location.pathname === href;
    return (
      location.pathname === href || location.pathname.startsWith(href + "/")
    );
  };

  const isParentActive = (subItems?: NavSubItem[]) =>
    !!subItems?.some(
      (item) =>
        location.pathname === item.href ||
        location.pathname.startsWith(item.href + "/"),
    );

  // Keep the sidebar in sync with deep links / back-forward navigation.
  useEffect(() => {
    const activeParent = navigation.find(
      (item) => item.subItems && isParentActive(item.subItems),
    );
    if (activeParent && expandedMenu !== activeParent.name) {
      setExpandedMenu(activeParent.name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, navigation]);

  const toggleMenu = (name: string) =>
    setExpandedMenu(expandedMenu === name ? null : name);

  const defaultTitle = () => {
    const active = navigation.find(
      (i) => (i.href && isActive(i.href)) || isParentActive(i.subItems),
    );
    return active?.name ?? "";
  };
  const pageTitle = getPageTitle
    ? getPageTitle(location.pathname)
    : defaultTitle();

  const renderNav = (collapsed: boolean, onNavigate?: () => void) =>
    navigation.map((item) => {
      const Icon = item.icon;
      const hasSubItems = item.subItems && item.subItems.length > 0;
      const parentActive = hasSubItems && isParentActive(item.subItems);
      const isExpanded = expandedMenu === item.name;

      if (item.externalUrl) {
        const disabled = item.disabled;
        return (
          <button
            key={item.name}
            type="button"
            disabled={disabled}
            onClick={() => {
              if (disabled) return;
              window.open(item.externalUrl, "_blank", "noopener,noreferrer");
              onNavigate?.();
            }}
            title={collapsed ? item.name : undefined}
            className={`flex w-full items-center ${
              collapsed ? "justify-center" : "gap-3"
            } rounded-lg px-3 py-2.5 transition-all ${
              disabled
                ? "text-gray-400 cursor-not-allowed"
                : "text-gray-700 hover:text-gray-900 hover:bg-blue-50"
            }`}
          >
            <Icon className="h-5 w-5 flex-shrink-0" />
            {!collapsed && (
              <span className="text-sm flex-1 flex items-center justify-between gap-2">
                <span>{item.name}</span>
                <ExternalLink
                  className={`h-3 w-3 ${disabled ? "opacity-40" : "opacity-60"}`}
                />
              </span>
            )}
          </button>
        );
      }

      if (hasSubItems) {
        return (
          <div key={item.name}>
            <button
              onClick={() => (collapsed ? undefined : toggleMenu(item.name))}
              title={collapsed ? item.name : undefined}
              className={`flex w-full items-center ${
                collapsed ? "justify-center" : "justify-between"
              } rounded-lg px-3 py-2.5 transition-all hover:bg-blue-50 ${
                parentActive
                  ? "bg-blue-50 text-blue-600 font-medium"
                  : "text-gray-700 hover:text-gray-900"
              }`}
            >
              <div className={`flex items-center ${collapsed ? "" : "gap-3"}`}>
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span className="text-sm">{item.name}</span>}
              </div>
              {!collapsed &&
                (isExpanded ? (
                  <ChevronDown className="h-4 w-4 flex-shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 flex-shrink-0" />
                ))}
            </button>
            {!collapsed && isExpanded && (
              <div className="ml-9 mt-1 space-y-1">
                {item.subItems!.map((subItem) => (
                  <Link
                    key={subItem.href}
                    to={subItem.href}
                    onClick={onNavigate}
                    className={`flex items-center rounded-lg px-3 py-2 text-sm transition-all hover:bg-blue-50 ${
                      isActive(subItem.href)
                        ? "bg-blue-50 text-blue-600 font-medium"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {subItem.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      }

      const active = isActive(item.href!);
      return (
        <Link
          key={item.name}
          to={item.href!}
          onClick={onNavigate}
          title={collapsed ? item.name : undefined}
          className={`flex items-center ${
            collapsed ? "justify-center" : "gap-3"
          } rounded-lg px-3 py-2.5 transition-all hover:bg-blue-50 ${
            active
              ? "bg-blue-50 text-blue-600 font-medium"
              : "text-gray-700 hover:text-gray-900"
          }`}
        >
          <Icon className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span className="text-sm">{item.name}</span>}
        </Link>
      );
    });

  const displayName = user?.name ?? "Guest";
  const displaySubtitle = user?.subtitle ?? "";
  const avatarInitials = user?.avatarInitials ?? "?";
  const avatarColor = user?.avatarColor ?? "bg-blue-600";

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex md:flex-col border-r border-gray-200 bg-white transition-all duration-300 ${
          sidebarCollapsed ? "md:w-16" : "md:w-56"
        }`}
      >
        <div className="flex h-14 items-center justify-between border-b border-gray-200 px-3">
          {!sidebarCollapsed ? (
            <>
              <img src={logoSrc} alt="Logo" className="h-6 object-contain" />
              <button
                onClick={() => setSidebarCollapsed(true)}
                className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                title="Collapse sidebar"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </>
          ) : (
            <button
              onClick={() => setSidebarCollapsed(false)}
              className="w-full flex items-center justify-center"
              title="Expand sidebar"
            >
              <img
                src={logoIconSrc}
                alt="Logo"
                className="h-8 w-8 object-contain"
              />
            </button>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {renderNav(sidebarCollapsed)}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-6 flex-shrink-0">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold text-gray-900">{pageTitle}</h1>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 hover:bg-gray-50"
                >
                  <div
                    className={`w-8 h-8 rounded-full ${avatarColor} flex items-center justify-center text-white font-medium text-sm`}
                  >
                    {avatarInitials}
                  </div>
                  <div className="text-left hidden lg:block">
                    <p className="text-sm font-medium text-gray-900">
                      {displayName}
                    </p>
                    <p className="text-xs text-gray-600">{displaySubtitle}</p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-600 hidden lg:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div>
                    <p className="font-medium">{displayName}</p>
                    <p className="text-xs font-normal text-gray-600">
                      {displaySubtitle}
                    </p>
                  </div>
                </DropdownMenuLabel>
                {(userMenuItems.length > 0 || onLogout) && (
                  <DropdownMenuSeparator />
                )}
                {userMenuItems.map((mi) => {
                  const MiIcon = mi.icon;
                  return (
                    <DropdownMenuItem key={mi.label} onClick={mi.onClick}>
                      {MiIcon && <MiIcon className="h-4 w-4 mr-2" />}
                      {mi.label}
                    </DropdownMenuItem>
                  );
                })}
                {onLogout && (
                  <>
                    {userMenuItems.length > 0 && <DropdownMenuSeparator />}
                    <DropdownMenuItem onClick={onLogout} className="text-red-600">
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <RouteProgress />
          {children ?? <Outlet />}
        </main>
      </div>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-50 md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-64 bg-white shadow-2xl z-50 flex flex-col md:hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <img src={logoSrc} alt="Logo" className="h-6 object-contain" />
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto p-3 space-y-1">
                {renderNav(false, () => setIsMobileMenuOpen(false))}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
