import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Info, XCircle, Clock, UserCog, Lock } from 'lucide-react';
import { useLanguage } from '@/components/providers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import type { translations } from '@/lib/translations';

type TranslationKey = keyof typeof translations.en;
type StatusMsg = { type: 'success' | 'info' | 'error' | 'warning'; key: TranslationKey };

// Convert both Arabic-Indic (٠-٩ U+0660) and Extended Arabic/Persian (۰-۹ U+06F0) to Western digits
const toWesternDigits = (s: string) =>
  s.replace(/[٠-٩]/g, d => String(d.charCodeAt(0) - 0x0660))
   .replace(/[۰-۹]/g, d => String(d.charCodeAt(0) - 0x06F0));

export default function Home() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const [studentId, setStudentId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<StatusMsg | null>(null);
  
  const [showTeacherLogin, setShowTeacherLogin] = useState(false);
  const [teacherPassword, setTeacherPassword] = useState('');
  const [teacherError, setTeacherError] = useState('');

  // Extract query params
  const [queryParams, setQueryParams] = useState<{ course: string, section: string, lecture: string } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const course = params.get('course');
    const section = params.get('section');
    const lecture = params.get('lecture');

    if (course && section && lecture) {
      setQueryParams({ course, section, lecture });
    }
  }, []);

  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const westernVal = toWesternDigits(rawVal);
    // filter non-digits
    const numericVal = westernVal.replace(/\D/g, '');
    if (numericVal.length <= 9) {
      setStudentId(numericVal);
    }
    setStatusMessage(null);
  };

  const handleCheckIn = () => {
    if (studentId.length !== 9) return;
    
    setIsSubmitting(true);
    setStatusMessage(null);
    
    // Simulate API call — use translation keys so the message respects language toggle
    setTimeout(() => {
      setIsSubmitting(false);
      setStatusMessage({ type: 'success', key: 'attendanceSuccess' });
      setStudentId('');
    }, 1200);
  };

  const handleTeacherLogin = () => {
    if (!teacherPassword) return;
    if (teacherPassword === 'wrong') {
      setTeacherError('كلمة المرور غير صحيحة / Incorrect password');
      return;
    }
    setShowTeacherLogin(false);
    setLocation('/teacher');
  };

  return (
    <div className="flex-1 flex flex-col items-center pt-12 pb-24 px-4 w-full max-w-2xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-br from-[#15803d] to-[#22c55e] text-transparent bg-clip-text mb-2">
          حاضر
        </h1>
        <h2 className="text-xl tracking-[0.3em] font-sans text-primary/70 mb-6">
          HATHER
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
          سجّل حضورك باستخدام رقمك الجامعي
          <br />
          <span className="text-sm font-sans opacity-80">Register your attendance using your Student ID</span>
        </p>
      </motion.div>

      {queryParams && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="w-full glass-card rounded-2xl overflow-hidden mb-8 border-t-4 border-t-primary shadow-xl"
        >
          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <h3 className="font-semibold text-lg">{t('lecture')} Info</h3>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                مفتوح / Open
              </span>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center divide-x rtl:divide-x-reverse divide-border">
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground mb-1">{t('course')}</span>
                <span className="font-bold text-foreground text-lg">{queryParams.course}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground mb-1">{t('section')}</span>
                <span className="font-bold text-foreground text-lg">{queryParams.section}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground mb-1">{t('lecture')}</span>
                <span className="font-bold text-foreground text-lg">{queryParams.lecture}</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="w-full glass-card rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col gap-6">
          <div className="flex flex-col gap-2 text-center">
            <label htmlFor="student-id" className="font-bold text-xl">{t('studentId')}</label>
          </div>
          
          <Input
            id="student-id"
            type="text"
            inputMode="numeric"
            value={studentId}
            onChange={handleIdChange}
            placeholder="○○○○○○○○○"
            className="h-20 text-4xl text-center font-mono tracking-widest rounded-xl border-2 focus-visible:ring-primary focus-visible:border-primary shadow-inner bg-background/50"
            maxLength={9}
          />
          
          <Button
            size="lg"
            className="w-full h-16 text-xl rounded-xl shadow-lg transition-transform active:scale-[0.98]"
            disabled={studentId.length !== 9 || isSubmitting}
            onClick={handleCheckIn}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                جاري التسجيل...
              </span>
            ) : (
              t('checkIn')
            )}
          </Button>

          <div className="min-h-[4rem] flex items-center justify-center">
            <AnimatePresence mode="wait">
              {statusMessage && (
                <motion.div
                  key={statusMessage.key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`flex items-center gap-3 p-4 rounded-xl text-center w-full justify-center ${
                    statusMessage.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                    statusMessage.type === 'error' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                    statusMessage.type === 'info' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                    'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
                  }`}
                >
                  {statusMessage.type === 'success' && <CheckCircle className="w-5 h-5 flex-shrink-0" />}
                  {statusMessage.type === 'error' && <XCircle className="w-5 h-5 flex-shrink-0" />}
                  {statusMessage.type === 'info' && <Info className="w-5 h-5 flex-shrink-0" />}
                  {statusMessage.type === 'warning' && <Clock className="w-5 h-5 flex-shrink-0" />}
                  <span className="font-medium text-sm md:text-base">{t(statusMessage.key)}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Floating Teacher Login Button */}
      <Button
        variant="default"
        size="icon"
        className="fixed bottom-6 left-6 w-12 h-12 rounded-full shadow-xl z-50 bg-primary hover:bg-primary/90 text-primary-foreground"
        onClick={() => setShowTeacherLogin(true)}
      >
        <UserCog className="w-5 h-5" />
      </Button>

      {/* Teacher Login Modal */}
      <Dialog open={showTeacherLogin} onOpenChange={setShowTeacherLogin}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              {t('instructorLogin')}
            </DialogTitle>
          </DialogHeader>
          <div className="py-6 flex flex-col gap-4">
            <div className="space-y-2">
              <label htmlFor="teacher-password">{t('password')}</label>
              <Input
                id="teacher-password"
                type="password"
                value={teacherPassword}
                onChange={(e) => {
                  setTeacherPassword(e.target.value);
                  setTeacherError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleTeacherLogin();
                }}
                className="font-sans"
              />
              {teacherError && (
                <p className="text-sm text-destructive mt-1">{teacherError}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleTeacherLogin} className="w-full sm:w-auto">
              {t('enter')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
