import React from 'react';
import { Moon, Sun, Globe } from 'lucide-react';
import { useTheme, useLanguage } from '@/components/providers';
import { Button } from '@/components/ui/button';
import { config } from '@/config';
import { GraduationCap } from 'lucide-react';

export function Header() {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  return (
    <header className="w-full py-4 px-6 flex items-center justify-between z-10 relative">
      <div className="flex items-center gap-3">
        <div className="bg-primary text-primary-foreground p-2 rounded-xl shadow-md">
          <GraduationCap className="w-6 h-6" />
        </div>
        <div className="flex flex-col">
          <h1 className="font-bold text-xl leading-tight tracking-tight">{t('appName')}</h1>
          <span className="text-xs text-muted-foreground font-medium hidden sm:inline-block">
            {t('universityName')}
          </span>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
          title="Toggle Language"
        >
          <Globe className="w-5 h-5 text-foreground/70" />
          <span className="sr-only">Toggle Language</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title="Toggle Theme"
        >
          <Sun className="w-5 h-5 text-foreground/70 hidden dark:block" />
          <Moon className="w-5 h-5 text-foreground/70 block dark:hidden" />
          <span className="sr-only">Toggle Theme</span>
        </Button>
      </div>
    </header>
  );
}

export function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="w-full py-6 mt-auto text-center border-t border-border/50 z-10 relative bg-background/50 backdrop-blur-sm">
      <p className="text-sm text-muted-foreground font-medium">
        {t('footer')}
      </p>
    </footer>
  );
}
