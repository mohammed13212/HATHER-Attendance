import React, { useState } from 'react';
import { useLocation } from 'wouter';
import {
  LayoutDashboard, Users, BookOpen, CalendarDays, ClipboardCheck,
  BarChart3, Settings, Search, Bell, LogOut, ArrowUpRight, Home, Menu, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/components/providers';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function Admin() {
  const { t, language } = useLanguage();
  const [, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeNav, setActiveNav] = useState(0);

  const navItems = [
    { icon: LayoutDashboard, label: t('dashboard') },
    { icon: Users, label: t('students') },
    { icon: BookOpen, label: t('courses') },
    { icon: CalendarDays, label: t('lectures') },
    { icon: ClipboardCheck, label: t('attendance') },
    { icon: BarChart3, label: t('reports') },
    { icon: Settings, label: t('settings') },
  ];

  const mockAttendance = [
    { id: '443110293', name: 'أحمد صالح العمر',        course: 'CS101',   section: '101', lecture: '1', time: '08:15 AM', status: 'Open' },
    { id: '443110182', name: 'خالد عبدالله السالم',    course: 'CS101',   section: '101', lecture: '1', time: '08:16 AM', status: 'Open' },
    { id: '443110475', name: 'محمد فهد الشمري',        course: 'MATH201', section: '104', lecture: '3', time: '09:02 AM', status: 'Closed' },
    { id: '443110992', name: 'سعد عبدالرحمن التميمي', course: 'PHY101',  section: '102', lecture: '2', time: '10:05 AM', status: 'Open' },
    { id: '443110123', name: 'نواف علي المطيري',       course: 'CS101',   section: '101', lecture: '1', time: '08:18 AM', status: 'Open' },
    { id: '443110555', name: 'عبدالعزيز محمد الدوسري', course: 'MATH201', section: '104', lecture: '3', time: '09:04 AM', status: 'Closed' },
    { id: '443110881', name: 'عمر زيد القحطاني',       course: 'CS101',   section: '101', lecture: '1', time: '08:20 AM', status: 'Open' },
    { id: '443110334', name: 'فراس بندر العنزي',       course: 'ENG101',  section: '105', lecture: '1', time: '11:00 AM', status: 'Open' },
  ];

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="h-20 flex items-center px-6 border-b border-white/10 gap-3 flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-[#064e3b] border border-white/20 flex items-center justify-center overflow-hidden flex-shrink-0">
          <img
            src={`${import.meta.env.BASE_URL}nbu-logo.png`}
            alt="NBU"
            className="w-full h-full object-contain p-0.5"
          />
        </div>
        <span className="font-bold text-lg tracking-wide">Hather Admin</span>
        {/* Close button — mobile only */}
        <button
          className="ml-auto lg:hidden text-white/60 hover:text-white"
          onClick={() => setSidebarOpen(false)}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-1">
        {navItems.map((item, i) => (
          <button
            key={i}
            onClick={() => { setActiveNav(i); setSidebarOpen(false); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors w-full
              ${language === 'ar' ? 'text-right flex-row-reverse' : 'text-left'}
              ${activeNav === i
                ? 'bg-[#22c55e] text-white shadow-lg shadow-[#22c55e]/20'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="p-4 flex-shrink-0 border-t border-white/10">
        <Button
          variant="ghost"
          className={`w-full text-white/70 hover:text-white hover:bg-white/10 mb-1
            ${language === 'ar' ? 'flex-row-reverse justify-end' : 'justify-start'}`}
          onClick={() => setLocation('/')}
        >
          <Home className="w-5 h-5 mx-2" />
          {t('back')}
        </Button>
        <Button
          variant="ghost"
          className={`w-full text-red-300 hover:text-red-200 hover:bg-red-500/10
            ${language === 'ar' ? 'flex-row-reverse justify-end' : 'justify-start'}`}
        >
          <LogOut className="w-5 h-5 mx-2" />
          Logout
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">

      {/* ── Desktop sidebar (always visible ≥ lg) ── */}
      <aside className="hidden lg:flex w-[260px] bg-[#14532d] text-white flex-shrink-0 flex-col z-20">
        <SidebarContent />
      </aside>

      {/* ── Mobile sidebar overlay ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-30 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            {/* Drawer */}
            <motion.aside
              key="drawer"
              initial={{ x: language === 'ar' ? '100%' : '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: language === 'ar' ? '100%' : '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className={`fixed top-0 ${language === 'ar' ? 'right-0' : 'left-0'} h-full w-72 bg-[#14532d] text-white flex flex-col z-40 lg:hidden`}
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main content ── */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">

        {/* Top header */}
        <header className="h-16 lg:h-20 flex items-center justify-between px-4 lg:px-8 border-b bg-card z-10 gap-4">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden flex-shrink-0"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>

          <div className="relative flex-1 max-w-xs hidden sm:block">
            <Search className={`w-4 h-4 absolute top-1/2 -translate-y-1/2 text-muted-foreground
              ${language === 'ar' ? 'right-3' : 'left-3'}`}
            />
            <Input
              className={`bg-muted/50 border-none ${language === 'ar' ? 'pr-10' : 'pl-10'}`}
              placeholder="Search..."
            />
          </div>

          <div className="flex items-center gap-3 ms-auto">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
            </Button>
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
              AM
            </div>
          </div>
        </header>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 animate-in fade-in slide-in-from-bottom-4">
          <div className="mb-6 lg:mb-8">
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-1">{t('dashboard')}</h1>
            <p className="text-muted-foreground text-sm">
              {language === 'ar' ? 'مرحباً، الإدارة. إليك ما يحدث اليوم.' : "Welcome back, Admin. Here's what's happening today."}
            </p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
            {[
              { label: t('totalStudents'),   value: '1,247', icon: Users,          color: 'text-blue-600',    bg: 'bg-blue-100 dark:bg-blue-900/30',    trend: '+12%' },
              { label: t('totalCourses'),    value: '38',    icon: BookOpen,        color: 'text-purple-600',  bg: 'bg-purple-100 dark:bg-purple-900/30', trend: '+2%' },
              { label: t('activeLectures'),  value: '12',    icon: CalendarDays,    color: 'text-orange-600',  bg: 'bg-orange-100 dark:bg-orange-900/30', trend: '+4' },
              { label: t('todaysAttendance'),value: '847',   icon: ClipboardCheck,  color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30',trend: '+24%' },
            ].map((stat, i) => (
              <div key={i} className="glass-card p-4 lg:p-6 rounded-2xl flex flex-col justify-between">
                <div className="flex justify-between items-start mb-3 lg:mb-4">
                  <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-full ${stat.bg} ${stat.color} flex items-center justify-center`}>
                    <stat.icon className="w-5 h-5 lg:w-6 lg:h-6" />
                  </div>
                  <span className="flex items-center text-xs font-medium text-emerald-600 bg-emerald-100/50 px-2 py-0.5 rounded-md">
                    {stat.trend} <ArrowUpRight className="w-3 h-3 ms-1" />
                  </span>
                </div>
                <div>
                  <h3 className="text-2xl lg:text-3xl font-bold text-foreground mb-0.5">{stat.value}</h3>
                  <p className="text-xs lg:text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Attendance table */}
          <div className="glass-card rounded-2xl overflow-hidden shadow-sm border">
            <div className="p-4 lg:p-6 border-b flex justify-between items-center bg-card">
              <h2 className="text-lg lg:text-xl font-bold text-foreground">
                {language === 'ar' ? 'سجل الحضور الأخير' : 'Recent Attendance'}
              </h2>
              <Button variant="outline" size="sm">{t('viewAll')}</Button>
            </div>
            <div className="overflow-x-auto">
              <table className={`w-full text-sm ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                <thead className="text-xs uppercase bg-[#14532d] text-white">
                  <tr>
                    {['Student ID', 'Name', 'Course', 'Section', 'Lecture', 'Time', 'Status'].map((h, i) => (
                      <th key={i} className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mockAttendance.map((row, i) => (
                    <tr key={i} className={`border-b border-border hover:bg-muted/50 transition-colors ${i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}>
                      <td className="px-4 lg:px-6 py-3 font-mono font-medium whitespace-nowrap">{row.id}</td>
                      <td className="px-4 lg:px-6 py-3 font-medium whitespace-nowrap">{row.name}</td>
                      <td className="px-4 lg:px-6 py-3 text-primary font-bold">{row.course}</td>
                      <td className="px-4 lg:px-6 py-3">{row.section}</td>
                      <td className="px-4 lg:px-6 py-3">{row.lecture}</td>
                      <td className="px-4 lg:px-6 py-3 text-muted-foreground whitespace-nowrap">{row.time}</td>
                      <td className="px-4 lg:px-6 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                          row.status === 'Open'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {row.status === 'Open' ? t('open') : t('closed')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
