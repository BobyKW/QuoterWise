'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/icons';
import { ArrowRight, Bot, Database, LayoutTemplate, Zap, Users, BarChart } from 'lucide-react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function LandingPage() {
  const { t } = useTranslation();
  const heroImage = PlaceHolderImages.find(img => img.id === 'landing-hero');

  const features = [
    {
      icon: Bot,
      title: t('landing_page.features.item1.title'),
      description: t('landing_page.features.item1.description'),
    },
    {
      icon: Users,
      title: t('landing_page.features.item2.title'),
      description: t('landing_page.features.item2.description'),
    },
    {
      icon: Database,
      title: t('landing_page.features.item3.title'),
      description: t('landing_page.features.item3.description'),
    },
    {
      icon: LayoutTemplate,
      title: t('landing_page.features.item4.title'),
      description: t('landing_page.features.item4.description'),
    },
    {
      icon: Zap,
      title: t('landing_page.features.item5.title'),
      description: t('landing_page.features.item5.description'),
    },
    {
      icon: BarChart,
      title: t('landing_page.features.item6.title'),
      description: t('landing_page.features.item6.description'),
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 items-center px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Logo className="h-6 w-6 text-primary" />
            <span className="font-semibold text-foreground">QuoterWise</span>
          </Link>
          <nav className="ml-auto flex items-center gap-4">
             <Button variant="ghost" asChild>
                <Link href="/login">{t('login_page.login_button')}</Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard">{t('landing_page.header.dashboard')}</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-24 md:py-32 lg:py-48">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
              <div className="flex flex-col items-start justify-center space-y-6">
                <div className="space-y-4">
                  <h1 className="text-4xl font-bold tracking-tighter text-foreground sm:text-5xl md:text-6xl xl:text-7xl/none">
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
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                </div>
              </div>
              {heroImage && (
                <div className="flex items-center justify-center">
                    <Image
                        src={heroImage.imageUrl}
                        width="600"
                        height="400"
                        alt="Hero"
                        data-ai-hint={heroImage.imageHint}
                        className="overflow-hidden rounded-xl object-cover shadow-2xl"
                    />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-20 md:py-24 lg:py-32 bg-card border-t border-b">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground">{t('landing_page.features.tagline')}</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">{t('landing_page.features.title')}</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  {t('landing_page.features.description')}
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3 mt-16">
              {features.map((feature, index) => (
                <Card key={index} className="flex flex-col items-start p-6 border-transparent shadow-none hover:shadow-lg hover:border-border transition-shadow">
                  <CardHeader className="p-0 mb-4">
                     <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <feature.icon className="h-6 w-6" />
                    </div>
                  </CardHeader>
                  <CardContent className="p-0 flex-grow">
                     <CardTitle className="text-lg font-bold mb-2 text-left">{feature.title}</CardTitle>
                    <p className="text-sm text-muted-foreground text-left">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-20 md:py-24 lg:py-32">
            <div className="container mx-auto grid items-center justify-center gap-4 px-4 text-center md:px-6">
                <div className="space-y-3">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">{t('landing_page.cta.title')}</h2>
                <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                    {t('landing_page.cta.description')}
                </p>
                </div>
                <div className="mx-auto w-full max-w-sm space-y-2 mt-4">
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

      <footer className="flex flex-col gap-4 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <div className="flex items-center gap-2">
            <Logo className="h-5 w-5 text-primary" />
            <p className="text-xs text-muted-foreground">{t('landing_page.footer.copyright')}</p>
        </div>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-xs hover:underline underline-offset-4 text-muted-foreground">
            {t('landing_page.footer.terms')}
          </Link>
          <Link href="#" className="text-xs hover:underline underline-offset-4 text-muted-foreground">
            {t('landing_page.footer.privacy')}
          </Link>
        </nav>
      </footer>
    </div>
  );
}
