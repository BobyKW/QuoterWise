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
  Zap,
  Star,
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
import { useUser, useAuth, useDoc, useFirestore, useMemoFirebase, initiateAnonymousSignIn } from '@/firebase';
import { signOut } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthModalProvider, useAuthModal } from '@/hooks/use-auth-modal';
import { AuthModal } from '@/components/auth-modal';
import type { UserProfile } from '@/lib/types';
import { useQuoteLimits } from '@/hooks/use-quote-limits';
import { Badge } from './ui/badge';


function MainNav() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { user } = useUser();
  const { onOpen } = useAuthModal();
  const isAnonymous = user?.isAnonymous ?? true;
  const firestore = useFirestore();
  const { isPro } = useQuoteLimits();

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

  const paymentLink = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK;

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
                <span className="text-sidebar-foreground">{item.label}</span>
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
                <span className="text-sidebar-foreground">{item.label}</span>
              </SidebarMenuButton>
            </Link>
          )}
      </SidebarMenuItem>
    );
  }

  return (
    <>
      <div className="flex-grow">
        <SidebarMenu>
          {navItems.map(renderMenuItem)}
        </SidebarMenu>
      </div>

      <div>
          {!isPro && paymentLink && (
              <div className="p-2">
                  <Button className="w-full justify-start bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:opacity-90" asChild>
                      <a href={paymentLink} target="_blank" rel="noopener noreferrer">
                          <Zap className="mr-2 h-4 w-4" />
                          <span className="group-data-[collapsible=icon]:hidden">{t('sidebar.upgrade_to_pro')}</span>
                      </a>
                  </Button>
              </div>
          )}
          <SidebarMenu>
              {userProfile?.role === 'admin' && (
                  <SidebarMenuItem>
                      <Link href="/admin">
                          <SidebarMenuButton
                              isActive={pathname.startsWith('/admin')}
                              tooltip={t('sidebar.admin')}
                          >
                              <Shield />
                              <span className="text-sidebar-foreground">{t('sidebar.admin')}</span>
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
  const { isPro } = useQuoteLimits();

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
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
            <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground">{getInitials(user?.email)}</AvatarFallback>
          </Avatar>
          <div className="flex-grow truncate">
            <div className="flex items-center gap-2">
              <p className="font-medium text-sm text-sidebar-foreground">{user?.displayName || 'User'}</p>
              {isPro && (
                <Badge variant="destructive" className="gap-1 bg-amber-500 text-white hover:bg-amber-600 border-transparent">
                  <Star className="h-3 w-3" />
                  PRO
                </Badge>
              )}
            </div>
            <p className="text-xs text-sidebar-foreground/70 truncate">{user?.email}</p>
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
    <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:hidden">
      <Button variant="ghost" size="icon" onClick={toggleSidebar} className="-ml-2">
        <PanelLeft className="h-5 w-5" />
        <span className="sr-only">Toggle Sidebar</span>
      </Button>
      <div className="flex items-center gap-2 font-semibold">
        <Logo className="h-6 w-6 text-primary" />
        <span className="text-foreground">QuoterWise</span>
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
    router.push('/');
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
    const { isPro } = useQuoteLimits();

    if(user?.isAnonymous) {
        return (
            <Button variant="ghost" size="icon" onClick={onOpen} className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
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
                <div className="relative cursor-pointer">
                    <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground">{getInitials(user?.email)}</AvatarFallback>
                    </Avatar>
                    {isPro && (
                        <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500 border-2 border-sidebar-background">
                            <Star className="h-2 w-2 text-white" fill="white" />
                        </span>
                    )}
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="center" className="w-56">
            <DropdownMenuLabel className="flex items-center justify-between">
                <span>{user?.email}</span>
                {isPro && <Badge variant="destructive" className="gap-1 bg-amber-500 text-white hover:bg-amber-600 border-transparent">PRO</Badge>}
            </DropdownMenuLabel>
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
  const auth = useAuth();
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    if (!isUserLoading && !user) {
      // If there's no user at all, sign in anonymously.
      // The onAuthStateChanged listener will then pick up the new anonymous user,
      // and on the next render, the `!user` condition will be false.
      initiateAnonymousSignIn(auth);
    }
  }, [user, isUserLoading, router, auth]);

  if (isUserLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-2 text-muted-foreground">
            <Logo className="h-6 w-6 animate-spin" />
            <span>{t('loading')}</span>
        </div>
      </div>
    );
  }

  return (
    <AuthModalProvider>
        <SidebarProvider>
            <div className="flex min-h-screen w-full">
                <Sidebar collapsible="icon">
                    <SidebarHeader className="border-b border-sidebar-border">
                    <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
                        <Logo className="h-6 w-6 text-primary" />
                        <span className={cn(
                        "font-semibold text-sidebar-foreground",
                        "group-data-[collapsible=icon]:hidden"
                        )}>QuoterWise</span>
                    </Link>
                    </SidebarHeader>
                    <SidebarContent>
                    <MainNav />
                    </SidebarContent>
                    <SidebarFooter className={cn("p-2 border-t border-sidebar-border", "group-data-[collapsible=icon]:hidden")}>
                    <UserMenu />
                    </SidebarFooter>
                    <SidebarFooter className={cn("p-2 border-t border-sidebar-border hidden", "group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center")}>
                        <CollapsedUserMenu />
                    </SidebarFooter>
                </Sidebar>
                <div className="flex flex-col flex-1">
                    <MobileHeader />
                    <main className="flex-1 bg-background">
                        {children}
                    </main>
                    <AuthModal />
                </div>
        </div>
        </SidebarProvider>
    </AuthModalProvider>
  );
}
