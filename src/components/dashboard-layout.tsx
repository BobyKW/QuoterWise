'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  LogOut,
  PanelLeft,
  Blocks,
  Library,
  Lock,
  Shield,
} from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Avatar,
  AvatarFallback,
} from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useUser, useAuth, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthModalProvider, useAuthModal } from '@/hooks/use-auth-modal';
import { AuthModal } from '@/components/auth-modal';
import type { UserProfile } from '@/lib/types';


function MainNav() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { user } = useUser();
  const { onOpen } = useAuthModal();
  const isAnonymous = user?.isAnonymous ?? true;
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (!user || isAnonymous) return null;
    return doc(firestore, `userProfiles/${user.uid}`);
  }, [user, isAnonymous, firestore]);
  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: t('sidebar.dashboard'), protected: false },
    { href: '/quotes', icon: FileText, label: t('sidebar.quotes'), protected: false },
    { href: '/reusable-blocks', icon: Blocks, label: t('sidebar.blocks'), protected: true },
    { href: '/clients', icon: Users, label: t('sidebar.clients'), protected: true },
    { href: '/templates', icon: Library, label: t('sidebar.templates'), protected: true },
  ];
  
  const bottomNavItems = [
      { href: '/settings', icon: Settings, label: t('sidebar.settings'), protected: false },
  ];

  const renderMenuItem = (item: typeof navItems[0]) => {
    const isProtectedAndAnonymous = item.protected && isAnonymous;

    return (
       <SidebarMenuItem key={item.href}>
          {isProtectedAndAnonymous ? (
            <SidebarMenuButton 
              onClick={onOpen}
              tooltip={item.label}
              className="flex justify-between items-center w-full cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <item.icon />
                <span>{item.label}</span>
              </div>
              <Lock className="h-3 w-3 text-muted-foreground" />
            </SidebarMenuButton>
          ) : (
            <Link href={item.href}>
              <SidebarMenuButton
                isActive={pathname.startsWith(item.href)}
                tooltip={item.label}
              >
                <item.icon />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </Link>
          )}
      </SidebarMenuItem>
    );
  }

  return (
    <>
    <SidebarMenu>
      {navItems.map(renderMenuItem)}
    </SidebarMenu>

    <div className="mt-auto">
        <SidebarMenu>
            {userProfile?.role === 'admin' && (
                <SidebarMenuItem>
                    <Link href="/admin">
                        <SidebarMenuButton
                            isActive={pathname.startsWith('/admin')}
                            tooltip={t('sidebar.admin')}
                        >
                            <Shield />
                            <span>{t('sidebar.admin')}</span>
                        </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
            )}
            {bottomNavItems.map(renderMenuItem)}
        </SidebarMenu>
    </div>
    </>
  );
}

function UserMenu() {
  const { user } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const { t } = useTranslation();

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };
  
  const getInitials = (email?: string | null) => {
    if (!email) return '..';
    return email.substring(0, 2).toUpperCase();
  }

  // Hide user menu for anonymous users
  if (user?.isAnonymous) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center w-full text-left p-2 rounded-md hover:bg-sidebar-accent transition-colors">
          <Avatar className="h-8 w-8 mr-2">
            <AvatarFallback>{getInitials(user?.email)}</AvatarFallback>
          </Avatar>
          <div className="flex-grow truncate">
            <p className="font-medium text-sm text-sidebar-foreground">{user?.displayName || 'User'}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="start" className="w-56">
        <DropdownMenuLabel>{t('user_menu.my_account')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/settings')} className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <span>{t('user_menu.settings')}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>{t('user_menu.logout')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MobileHeader() {
  const { toggleSidebar } = useSidebar();
  return (
    <header className="flex h-14 items-center gap-4 border-b bg-card px-4 md:hidden">
      <Button variant="ghost" size="icon" onClick={toggleSidebar} className="-ml-2">
        <PanelLeft className="h-5 w-5" />
        <span className="sr-only">Toggle Sidebar</span>
      </Button>
      <div className="flex items-center gap-2 font-semibold">
        <Logo className="h-6 w-6 text-primary" />
        <span className="">QuoterWise</span>
      </div>
    </header>
  );
}

function LogoutButton() {
  const auth = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };
  return (
    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
      <LogOut className="mr-2 h-4 w-4" />
      <span>{t('sidebar.logout')}</span>
    </DropdownMenuItem>
  )
}

function CollapsedUserMenu() {
    const { user } = useUser();
    const router = useRouter();
    const { t } = useTranslation();
    const { onOpen } = useAuthModal();

    if(user?.isAnonymous) {
        return (
            <Button variant="ghost" size="icon" onClick={onOpen}>
                <LogOut className="h-4 w-4 -rotate-90" />
            </Button>
        )
    }

    const getInitials = (email?: string | null) => {
        if (!email) return '..';
        return email.substring(0, 2).toUpperCase();
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
            <Avatar className="h-8 w-8 cursor-pointer">
                <AvatarFallback>{getInitials(user?.email)}</AvatarFallback>
            </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="center" className="w-56">
            <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/settings')} className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>{t('user_menu.settings')}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <LogoutButton />
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>{t('loading')}</p>
      </div>
    );
  }

  return (
    <AuthModalProvider>
        <SidebarProvider>
            <div className="flex min-h-screen">
                <Sidebar collapsible="icon">
                    <SidebarHeader className="border-b">
                    <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
                        <Logo className="h-6 w-6 text-primary" />
                        <span className={cn(
                        "font-semibold",
                        "group-data-[collapsible=icon]:hidden"
                        )}>QuoterWise</span>
                    </Link>
                    </SidebarHeader>
                    <SidebarContent>
                    <MainNav />
                    </SidebarContent>
                    <SidebarFooter className={cn("p-2 border-t", "group-data-[collapsible=icon]:hidden")}>
                    <UserMenu />
                    </SidebarFooter>
                    <SidebarFooter className={cn("p-2 border-t hidden", "group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center")}>
                        <CollapsedUserMenu />
                    </SidebarFooter>
                </Sidebar>
                <div className="flex flex-col flex-1">
                    <MobileHeader />
                    <main className="flex-1">
                        {children}
                    </main>
                    <AuthModal />
                </div>
        </div>
        </SidebarProvider>
    </AuthModalProvider>
  );
}
