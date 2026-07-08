import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Clock, Info, UserCog, Lock } from 'lucide-react';
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
    if (studentId.length !== 9) return;
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
    setLocation('/teacher');
  };

  return (
    <div
      className="min-h-[100dvh] w-full flex flex-col relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #2d6b45 0%, #1e5233 60%, #174028 100%)' }}
    >
      {/* Subtle texture overlay */}
      <div className="absolute inset-0 opacity-10 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, #4ade80 0%, transparent 50%), radial-gradient(circle at 80% 20%, #86efac 0%, transparent 50%)' }}
      />

      {/* Top-right: University Logo */}
      <div className="absolute top-5 right-6 z-20 text-right">
        <p className="text-white font-bold text-base leading-tight" dir="rtl">جامعة الحدود الشمالية</p>
        <p className="text-white/75 text-xs font-sans leading-tight" dir="ltr">Northern Border University</p>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-20">

        {/* Branding */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-6xl md:text-7xl font-extrabold text-white mb-1 drop-shadow-md">
            Hather
          </h1>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-3 drop-shadow-md" dir="rtl">
            حاضر
          </h2>
          <p className="text-white/80 text-sm" dir="rtl">
            سجّل حضورك باستخدام الرقم الجامعي
          </p>
        </motion.div>

        {/* Lecture info card */}
        {queryParams && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="w-full max-w-md mb-4 rounded-2xl overflow-hidden shadow-xl"
            style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.2)' }}
          >
            <div className="p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-white text-base">{t('lecture')} Info</h3>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-400/20 text-green-100 border border-green-300/30">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  مفتوح / Open
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center divide-x rtl:divide-x-reverse divide-white/20">
                <div>
                  <span className="text-xs text-white/60">{t('course')}</span>
                  <p className="font-bold text-white text-lg">{queryParams.course}</p>
                </div>
                <div>
                  <span className="text-xs text-white/60">{t('section')}</span>
                  <p className="font-bold text-white text-lg">{queryParams.section}</p>
                </div>
                <div>
                  <span className="text-xs text-white/60">{t('lecture')}</span>
                  <p className="font-bold text-white text-lg">{queryParams.lecture}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Check-in card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.13)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.22)' }}
        >
          <div className="p-7 flex flex-col gap-5">
            {/* Input */}
            <label htmlFor="student-id" className="sr-only">Student ID — الرقم الطلابي</label>
            <div className="relative flex items-center bg-white/95 rounded-2xl shadow-inner h-16 overflow-hidden focus-within:ring-2 focus-within:ring-white/60">
              <input
                id="student-id"
                type="text"
                inputMode="numeric"
                value={studentId}
                onChange={handleIdChange}
                maxLength={9}
                autoComplete="off"
                aria-label="Student ID — الرقم الطلابي"
                className={`absolute inset-0 w-full h-full bg-transparent border-none outline-none px-5 ${
                  studentId
                    ? 'text-center text-2xl font-mono tracking-[0.3em] text-gray-900 z-10'
                    : 'opacity-0 cursor-text'
                }`}
              />
              {!studentId && (
                <div className="flex items-center justify-between w-full px-5 pointer-events-none select-none" aria-hidden="true">
                  <span className="text-gray-800 font-bold text-base whitespace-nowrap" dir="ltr">Enter university ID</span>
                  <div className="w-px h-7 bg-gray-300 flex-shrink-0 mx-2" />
                  <span className="text-gray-800 font-bold text-base whitespace-nowrap" dir="rtl">ادخل الرقم الطلابي</span>
                </div>
              )}
            </div>

            {/* Hint */}
            <p className="text-white/70 text-sm text-center" dir="rtl">
              أدخل الرقم الجامعي 9 أرقام
            </p>

            {/* Button */}
            <button
              disabled={studentId.length !== 9 || isSubmitting}
              onClick={handleCheckIn}
              className="w-full h-16 rounded-2xl flex items-center justify-between px-6 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              style={{ background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.3)' }}
            >
              <span className="text-white font-bold text-lg" dir="rtl">اضغط هنا</span>
              <span className="text-white font-bold text-lg" dir="ltr">
                {isSubmitting ? (
                  <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : 'Check in'}
              </span>
            </button>

            {/* Status */}
            <div className="min-h-[3rem] flex items-center justify-center">
              <AnimatePresence mode="wait">
                {statusMessage && (
                  <motion.div
                    key={statusMessage.key}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl w-full justify-center text-sm font-medium ${
                      statusMessage.type === 'success' ? 'bg-green-400/20 text-green-100 border border-green-300/30' :
                      statusMessage.type === 'error'   ? 'bg-red-400/20 text-red-100 border border-red-300/30' :
                      statusMessage.type === 'info'    ? 'bg-blue-400/20 text-blue-100 border border-blue-300/30' :
                                                         'bg-orange-400/20 text-orange-100 border border-orange-300/30'
                    }`}
                  >
                    {statusMessage.type === 'success' && <CheckCircle className="w-4 h-4 flex-shrink-0" />}
                    {statusMessage.type === 'error'   && <XCircle    className="w-4 h-4 flex-shrink-0" />}
                    {statusMessage.type === 'info'    && <Info        className="w-4 h-4 flex-shrink-0" />}
                    {statusMessage.type === 'warning' && <Clock       className="w-4 h-4 flex-shrink-0" />}
                    <span>{t(statusMessage.key)}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Floating Teacher Login Button */}
      <Button
        variant="default"
        size="icon"
        className="fixed bottom-6 left-6 w-12 h-12 rounded-full shadow-xl z-50 bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm"
        onClick={() => setShowTeacherLogin(true)}
        title="Teacher Login"
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
                onChange={e => { setTeacherPassword(e.target.value); setTeacherError(''); }}
                onKeyDown={e => { if (e.key === 'Enter') handleTeacherLogin(); }}
                className="font-sans"
              />
              {teacherError && <p className="text-sm text-destructive mt-1">{teacherError}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleTeacherLogin} className="w-full sm:w-auto">{t('enter')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
