'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/icons';
import { ArrowRight, Bot, Database, LayoutTemplate, Zap, Users, BarChart } from 'lucide-react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useTranslation } from 'react-i18next';

export default function LandingPage() {
  const { t } = useTranslation();
  const heroImage = PlaceHolderImages.find(img => img.id === 'landing-hero');

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 items-center px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Logo className="h-6 w-6 text-primary" />
            <span className="font-semibold">QuoterWise</span>
          </Link>
          <nav className="ml-auto flex items-center gap-4">
            <Button asChild>
              <Link href="/dashboard">{t('landing_page.header.dashboard')}</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-20 md:py-32 lg:py-40 bg-card">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    {t('landing_page.hero.title')}
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    {t('landing_page.hero.description')}
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button asChild size="lg" className="group">
                    <Link href="/dashboard">
                      {t('landing_page.hero.cta')}
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                </div>
              </div>
              {heroImage && (
                <Image
                    src={heroImage.imageUrl}
                    width="600"
                    height="400"
                    alt="Hero"
                    data-ai-hint={heroImage.imageHint}
                    className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last"
                />
              )}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">{t('landing_page.features.tagline')}</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">{t('landing_page.features.title')}</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  {t('landing_page.features.description')}
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3 mt-12">
              <div className="grid gap-1 text-center">
                 <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                    <Bot className="h-8 w-8 text-primary" />
                 </div>
                <h3 className="text-lg font-bold">{t('landing_page.features.item1.title')}</h3>
                <p className="text-sm text-muted-foreground">{t('landing_page.features.item1.description')}</p>
              </div>
              <div className="grid gap-1 text-center">
                 <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                    <Users className="h-8 w-8 text-primary" />
                 </div>
                <h3 className="text-lg font-bold">{t('landing_page.features.item2.title')}</h3>
                <p className="text-sm text-muted-foreground">{t('landing_page.features.item2.description')}</p>
              </div>
              <div className="grid gap-1 text-center">
                 <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                    <Database className="h-8 w-8 text-primary" />
                 </div>
                <h3 className="text-lg font-bold">{t('landing_page.features.item3.title')}</h3>
                <p className="text-sm text-muted-foreground">{t('landing_page.features.item3.description')}</p>
              </div>
               <div className="grid gap-1 text-center">
                 <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                    <LayoutTemplate className="h-8 w-8 text-primary" />
                 </div>
                <h3 className="text-lg font-bold">{t('landing_page.features.item4.title')}</h3>
                <p className="text-sm text-muted-foreground">{t('landing_page.features.item4.description')}</p>
              </div>
               <div className="grid gap-1 text-center">
                 <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                    <Zap className="h-8 w-8 text-primary" />
                 </div>
                <h3 className="text-lg font-bold">{t('landing_page.features.item5.title')}</h3>
                <p className="text-sm text-muted-foreground">{t('landing_page.features.item5.description')}</p>
              </div>
               <div className="grid gap-1 text-center">
                 <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                    <BarChart className="h-8 w-8 text-primary" />
                 </div>
                <h3 className="text-lg font-bold">{t('landing_page.features.item6.title')}</h3>
                <p className="text-sm text-muted-foreground">{t('landing_page.features.item6.description')}</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-card">
            <div className="container mx-auto grid items-center justify-center gap-4 px-4 text-center md:px-6">
                <div className="space-y-3">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">{t('landing_page.cta.title')}</h2>
                <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                    {t('landing_page.cta.description')}
                </p>
                </div>
                <div className="mx-auto w-full max-w-sm space-y-2">
                     <Button asChild size="lg" className="group w-full">
                        <Link href="/dashboard">
                            {t('landing_page.cta.button')}
                            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                    </Button>
                </div>
            </div>
        </section>
      </main>

      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">{t('landing_page.footer.copyright')}</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-xs hover:underline underline-offset-4">
            {t('landing_page.footer.terms')}
          </Link>
          <Link href="#" className="text-xs hover:underline underline-offset-4">
            {t('landing_page.footer.privacy')}
          </Link>
        </nav>
      </footer>
    </div>
  );
}
