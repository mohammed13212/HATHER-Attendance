import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Clock, Info, UserCog, Lock, Loader2 } from 'lucide-react';
import { useLanguage } from '@/components/providers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import type { translations } from '@/lib/translations';

type TranslationKey = keyof typeof translations.en;
type StatusMsg = { type: 'success' | 'info' | 'error' | 'warning'; key: TranslationKey };

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

  const [queryParams, setQueryParams] = useState<{ course: string; section: string; lecture: string } | null>(null);

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
    const numericVal = westernVal.replace(/\D/g, '');
    if (numericVal.length <= 9) setStudentId(numericVal);
    setStatusMessage(null);
  };

  const handleCheckIn = () => {
    if (studentId.length !== 9 || isSubmitting) return;
    setIsSubmitting(true);
    setStatusMessage(null);
    setTimeout(() => {
      setIsSubmitting(false);
      setStatusMessage({ type: 'success', key: 'attendanceSuccess' });
      setStudentId('');
    }, 1200);
  };

  const handleTeacherLogin = () => {
    if (!teacherPassword) return;
    if (teacherPassword !== '2004') {
      setTeacherError('كلمة المرور غير صحيحة / Incorrect password');
      return;
    }
    setShowTeacherLogin(false);
    setTeacherPassword('');
    setLocation('/teacher');
  };

  return (
    <div
      className="min-h-[100dvh] w-full flex flex-col relative overflow-hidden"
      style={{ background: 'linear-gradient(155deg, #2d6b45 0%, #1e5233 55%, #174028 100%)' }}
    >
      {/* Subtle ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(ellipse at 15% 85%, rgba(74,222,128,0.08) 0%, transparent 55%), radial-gradient(ellipse at 85% 15%, rgba(134,239,172,0.06) 0%, transparent 55%)',
        }}
      />

      {/* University name — top right */}
      <div className="absolute top-4 right-5 z-20 text-right select-none">
        <p className="text-white font-bold text-sm leading-tight" dir="rtl">جامعة الحدود الشمالية</p>
        <p className="text-white/65 text-[11px] font-sans leading-tight" dir="ltr">Northern Border University</p>
      </div>

      {/* Main content — centred vertically */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">

        {/* Branding */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="text-center mb-5"
        >
          <h1 className="text-5xl md:text-6xl font-extrabold text-white drop-shadow-sm leading-none mb-1">
            Hather
          </h1>
          <h2 className="text-3xl md:text-4xl font-bold text-white drop-shadow-sm leading-none mb-3" dir="rtl">
            حاضر
          </h2>
          <p className="text-white/70 text-sm" dir="rtl">
            سجّل حضورك باستخدام الرقم الجامعي
          </p>
        </motion.div>

        {/* Lecture info card (only when QR link has params) */}
        {queryParams && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.08 }}
            className="w-full max-w-sm mb-3 rounded-2xl overflow-hidden shadow-lg"
            style={{
              background: 'rgba(255,255,255,0.10)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.18)',
            }}
          >
            <div className="px-5 py-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-white text-sm">{t('lecture')} Info</h3>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-400/20 text-green-100 border border-green-300/25">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  مفتوح
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center divide-x rtl:divide-x-reverse divide-white/15">
                <div>
                  <p className="text-[10px] text-white/50 mb-0.5">{t('course')}</p>
                  <p className="font-bold text-white text-base">{queryParams.course}</p>
                </div>
                <div>
                  <p className="text-[10px] text-white/50 mb-0.5">{t('section')}</p>
                  <p className="font-bold text-white text-base">{queryParams.section}</p>
                </div>
                <div>
                  <p className="text-[10px] text-white/50 mb-0.5">{t('lecture')}</p>
                  <p className="font-bold text-white text-base">{queryParams.lecture}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Check-in card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.45 }}
          className="w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.11)',
            backdropFilter: 'blur(18px)',
            border: '1px solid rgba(255,255,255,0.20)',
          }}
        >
          <div className="p-5 flex flex-col gap-4">

            {/* Bilingual input */}
            <div>
              <label htmlFor="student-id" className="sr-only">Student ID — الرقم الطلابي</label>
              <div
                className="relative flex items-center bg-white rounded-xl h-14 shadow-sm overflow-hidden transition-shadow focus-within:shadow-md focus-within:ring-2 focus-within:ring-white/50"
              >
                <input
                  id="student-id"
                  type="text"
                  inputMode="numeric"
                  value={studentId}
                  onChange={handleIdChange}
                  maxLength={9}
                  autoComplete="off"
                  aria-label="Student ID — الرقم الطلابي"
                  className={`absolute inset-0 w-full h-full bg-transparent border-none outline-none px-4 ${
                    studentId
                      ? 'text-center text-xl font-mono tracking-[0.35em] text-gray-900 z-10'
                      : 'opacity-0 cursor-text'
                  }`}
                />
                {!studentId && (
                  <div
                    className="flex items-center justify-between w-full px-4 pointer-events-none select-none"
                    aria-hidden="true"
                  >
                    <span className="text-gray-700 font-semibold text-sm whitespace-nowrap" dir="ltr">
                      Enter university ID
                    </span>
                    <div className="w-px h-6 bg-gray-200 flex-shrink-0 mx-2" />
                    <span className="text-gray-700 font-semibold text-sm whitespace-nowrap" dir="rtl">
                      ادخل الرقم الطلابي
                    </span>
                  </div>
                )}
              </div>
              <p className="text-white/55 text-xs text-center mt-2" dir="rtl">
                أدخل الرقم الجامعي المكوّن من 9 أرقام
              </p>
            </div>

            {/* Check-in button — solid white for strong contrast */}
            <button
              disabled={studentId.length !== 9 || isSubmitting}
              onClick={handleCheckIn}
              className="
                w-full h-13 rounded-xl flex items-center justify-between px-5
                bg-white text-green-900 font-bold text-base
                hover:bg-white/90 active:scale-[0.98]
                disabled:opacity-40 disabled:cursor-not-allowed
                transition-all duration-150 shadow-md
              "
              style={{ height: '3.25rem' }}
            >
              <span dir="rtl">
                {isSubmitting ? 'جاري التسجيل...' : 'اضغط هنا'}
              </span>
              <span dir="ltr" className="flex items-center gap-2">
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Check in'
                )}
              </span>
            </button>

            {/* Status feedback */}
            <div className="min-h-[2.75rem] flex items-center justify-center" role="status" aria-live="polite" aria-atomic="true">
              <AnimatePresence mode="wait">
                {statusMessage && (
                  <motion.div
                    key={statusMessage.key}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl w-full justify-center text-sm font-medium ${
                      statusMessage.type === 'success'
                        ? 'bg-green-400/20 text-green-100 border border-green-300/25'
                        : statusMessage.type === 'error'
                        ? 'bg-red-400/20 text-red-100 border border-red-300/25'
                        : statusMessage.type === 'info'
                        ? 'bg-blue-400/20 text-blue-100 border border-blue-300/25'
                        : 'bg-orange-400/20 text-orange-100 border border-orange-300/25'
                    }`}
                  >
                    {statusMessage.type === 'success' && <CheckCircle className="w-4 h-4 flex-shrink-0" />}
                    {statusMessage.type === 'error'   && <XCircle     className="w-4 h-4 flex-shrink-0" />}
                    {statusMessage.type === 'info'    && <Info         className="w-4 h-4 flex-shrink-0" />}
                    {statusMessage.type === 'warning' && <Clock        className="w-4 h-4 flex-shrink-0" />}
                    <span>{t(statusMessage.key)}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Floating teacher login button */}
      <Button
        variant="default"
        size="icon"
        className="fixed bottom-5 left-5 w-11 h-11 rounded-full shadow-lg z-50 bg-white/15 hover:bg-white/25 text-white border border-white/25 backdrop-blur-sm transition-colors"
        onClick={() => setShowTeacherLogin(true)}
        title="Teacher Login"
      >
        <UserCog className="w-4 h-4" />
      </Button>

      {/* Teacher login modal */}
      <Dialog open={showTeacherLogin} onOpenChange={open => { setShowTeacherLogin(open); if (!open) { setTeacherPassword(''); setTeacherError(''); } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary" />
              {t('instructorLogin')}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 flex flex-col gap-3">
            <div className="space-y-1.5">
              <label htmlFor="teacher-password" className="text-sm font-medium text-foreground">
                {t('password')}
              </label>
              <Input
                id="teacher-password"
                type="password"
                value={teacherPassword}
                autoFocus
                onChange={e => { setTeacherPassword(e.target.value); setTeacherError(''); }}
                onKeyDown={e => { if (e.key === 'Enter') handleTeacherLogin(); }}
                className="font-sans h-10"
              />
              <AnimatePresence>
                {teacherError && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-sm text-destructive flex items-center gap-1.5"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    {teacherError}
                  </motion.p>
                )}
              </AnimatePresence>
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
