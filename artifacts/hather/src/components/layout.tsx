import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme, useLanguage } from '@/components/providers';
import { Button } from '@/components/ui/button';

export function Header() {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useLanguage();

  return (
    <header className="w-full bg-gradient-to-r from-[#14532d] to-[#166534] text-white py-4 px-6 flex items-center justify-between z-10 sticky top-0 shadow-md">
      {/* Left side (Logo & Text) */}
      <div className="flex flex-col">
        <span className="font-bold text-lg leading-tight" dir="rtl">جامعة الحدود الشمالية</span>
        <span className="text-[13px] opacity-80 leading-tight" dir="ltr">Northern Border University</span>
      </div>
      
      {/* Center (Empty) */}
      <div className="flex-1"></div>
      
      {/* Right side (Controls) */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20 hover:text-white"
          onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
          title="Toggle Language"
        >
          <span className="font-bold text-lg">{language === 'en' ? 'ع' : 'EN'}</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20 hover:text-white"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title="Toggle Theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </Button>
      </div>
    </header>
  );
}

export function Footer() {
  return null;
}
