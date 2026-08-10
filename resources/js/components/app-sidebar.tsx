import { Link, usePage } from '@inertiajs/react';
import { LayoutGrid, ChartColumnStacked, Barcode, BadgeDollarSign, UtensilsCrossed } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { NavItem, Auth } from '@/types';

const adminNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/admin/orders',
        icon: LayoutGrid,
    },
    {
        title: 'Categories',
        href: '/admin/categories',
        icon: ChartColumnStacked,
    },
    {
        title: 'Products',
        href: '/admin/products',
        icon: Barcode,
    },
    {
        title: 'Orders',
        href: '/admin/orders',
        icon: BadgeDollarSign,
    },
];

const clientNavItems: NavItem[] = [
    {
        title: 'Mis Pedidos',
        href: '/mi-cuenta/dashboard',
        icon: LayoutGrid,
    },
    {
        title: 'Hacer Pedido',
        href: '/mi-cuenta/menu',
        icon: UtensilsCrossed,
    },
];

const footerNavItems: NavItem[] = [];

export function AppSidebar() {
    const { auth } = usePage<{ auth: Auth }>().props;

    const isClient = auth.user?.roles?.some((r: any) => r.name === 'client');
    const mainNavItems = isClient ? clientNavItems : adminNavItems;
    const logoHref = isClient ? '/mi-cuenta/dashboard' : '/admin/orders';

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={logoHref} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}