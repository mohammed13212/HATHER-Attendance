import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeCanvas } from 'qrcode.react';
import {
  ArrowLeft, ArrowRight, Copy, RefreshCw, StopCircle, Download,
  Plus, Users, Clock, BookOpen, Layers, Hash, Timer,
  CalendarClock, CheckCircle, QrCode, Loader2, AlertTriangle,
} from 'lucide-react';
import { useLanguage } from '@/components/providers';
import { generateToken, currentSlot } from '@/services/attendance';
import { useGetAttendanceCounts } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// ── helpers ────────────────────────────────────────────────────────────────────

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function formatClock(date: Date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Labelled input with a leading icon
function FieldInput({
  id, icon: Icon, label, value, onChange, placeholder, type = 'text', min,
}: {
  id: string;
  icon: React.ElementType;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  min?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-sm font-medium text-foreground/80">
        {label}
      </Label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          id={id}
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          min={min}
          className="h-9 pl-9 text-sm"
        />
      </div>
    </div>
  );
}

// ── component ──────────────────────────────────────────────────────────────────

export default function Teacher() {
  const { t, language } = useLanguage();
  const [, setLocation] = useLocation();

  const [course, setCourse]     = useState('');
  const [section, setSection]   = useState('');
  const [lecture, setLecture]   = useState('');
  const [duration, setDuration] = useState('60');

  const [sessionActive, setSessionActive]           = useState(false);
  const [sessionStartTime, setSessionStartTime]     = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining]           = useState(0);
  const [qrTimestamp, setQrTimestamp]               = useState(Date.now());
  const [qrRefreshCountdown, setQrRefreshCountdown] = useState(20);
  const [creating, setCreating]                     = useState(false);
  const [copyFeedback, setCopyFeedback]             = useState(false);

  // Anti-cheat token data minted by the Apps Script for the current slot
  const [generatedAt, setGeneratedAt]   = useState<number | null>(null);
  const [qrToken, setQrToken]           = useState<string | null>(null);
  const [qrSlot, setQrSlot]             = useState<number | null>(null);
  const [tokenError, setTokenError]     = useState(false);
  const [retryingToken, setRetryingToken] = useState(false);

  const qrContainerRef = useRef<HTMLDivElement>(null);
  const tokenRequestId = useRef(0);

  // Fetch a fresh HMAC token from the Apps Script for the current 20s slot
  const refreshToken = async (startedAt: number, windowMinutes: number) => {
    const reqId = ++tokenRequestId.current;
    const slot = currentSlot();
    try {
      const { token, slot: mintedSlot } = await generateToken({
        course, section, lecture,
        generatedAt: startedAt,
        windowMinutes,
        slot,
      });
      if (reqId !== tokenRequestId.current) return false;
      setQrToken(token);
      setQrSlot(mintedSlot);
      setTokenError(false);
      return true;
    } catch {
      if (reqId !== tokenRequestId.current) return false;
      setQrToken(null);
      setQrSlot(null);
      setTokenError(true);
      return false;
    }
  };

  // Live attendee count, read from the attendance sheet and refreshed while
  // the session runs. No fabricated numbers: unknown states render as "—".
  const lectureNumber = parseInt(lecture, 10);
  const attendeeQuery = useGetAttendanceCounts(
    { lecture: lectureNumber },
    {
      query: {
        enabled: sessionActive && Number.isInteger(lectureNumber) && lectureNumber >= 1,
        refetchInterval: 15_000,
      },
    },
  );

  // Countdown timer
  useEffect(() => {
    if (!sessionActive || timeRemaining <= 0) {
      if (sessionActive && timeRemaining === 0) setSessionActive(false);
      return;
    }
    const id = setInterval(() => setTimeRemaining(p => p - 1), 1000);
    return () => clearInterval(id);
  }, [sessionActive, timeRemaining]);

  // QR auto-refresh: every 20s, rotate the slot and mint a fresh token
  useEffect(() => {
    if (!sessionActive || generatedAt === null) return;
    const windowMinutes = parseInt(duration) || 60;
    const id = setInterval(() => {
      setQrRefreshCountdown(p => {
        if (p <= 1) {
          setQrTimestamp(Date.now());
          void refreshToken(generatedAt, windowMinutes);
          return 20;
        }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [sessionActive, generatedAt, duration]);

  // The QR lacks valid token params — every scan would be rejected server-side
  const qrInsecure = qrToken === null || qrSlot === null;

  const handleRetryToken = async () => {
    if (generatedAt === null || retryingToken) return;
    setRetryingToken(true);
    const ok = await refreshToken(generatedAt, parseInt(duration) || 60);
    if (ok) {
      setQrTimestamp(Date.now());
      setQrRefreshCountdown(20);
    }
    setRetryingToken(false);
  };

  const attendanceUrl = (() => {
    const params = new URLSearchParams({ course, section, lecture });
    if (generatedAt !== null) params.set('generatedAt', String(generatedAt));
    params.set('windowMinutes', String(parseInt(duration) || 60));
    if (qrToken) params.set('token', qrToken);
    if (qrSlot !== null) params.set('slot', String(qrSlot));
    return `${window.location.origin}${import.meta.env.BASE_URL}?${params.toString()}`;
  })();

  const handleGenerateSession = async () => {
    if (!course || !section || !lecture || !duration) return;
    setCreating(true);
    const startedAt = Date.now();
    const windowMinutes = parseInt(duration) || 60;
    await refreshToken(startedAt, windowMinutes);
    setGeneratedAt(startedAt);
    setTimeRemaining(windowMinutes * 60);
    setQrRefreshCountdown(20);
    setQrTimestamp(startedAt);
    setSessionStartTime(new Date(startedAt));
    setSessionActive(true);
    setCreating(false);
  };

  const handleCloseSession = () => setSessionActive(false);

  const handleNewSession = () => {
    setSessionActive(false);
    setCourse(''); setSection(''); setLecture(''); setDuration('60');
    setSessionStartTime(null);
    setGeneratedAt(null); setQrToken(null); setQrSlot(null); setTokenError(false);
    tokenRequestId.current++;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(attendanceUrl).then(() => {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    });
  };

  const handleDownloadQR = () => {
    const canvas = qrContainerRef.current?.querySelector('canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `hather-qr-${course}-${section}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const isExpired = !sessionActive && sessionStartTime !== null;
  const canCreate = course && section && lecture && duration && !creating;

  return (
    <div className="w-full max-w-7xl mx-auto px-1 animate-in fade-in slide-in-from-bottom-3 duration-400">

      {/* Page header */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation('/')}
          className="text-muted-foreground hover:text-foreground gap-1.5 h-8 px-2"
        >
          {language === 'ar'
            ? <ArrowRight className="w-4 h-4" />
            : <ArrowLeft  className="w-4 h-4" />}
          <span className="text-sm">{t('back')}</span>
        </Button>
        <div className="h-4 w-px bg-border" />
        <h1 className="text-2xl font-bold text-foreground">{t('dashboard')}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── Left panel ─────────────────────────────────────────────────────── */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          <AnimatePresence mode="wait">
            {!sessionActive ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="glass-card rounded-2xl p-6"
              >
                <h2 className="text-base font-semibold text-foreground mb-5">{t('newSession')}</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                  <FieldInput
                    id="course" icon={BookOpen} label={t('course')}
                    value={course} onChange={setCourse} placeholder="e.g. CS101"
                  />
                  <FieldInput
                    id="section" icon={Layers} label={t('section')}
                    value={section} onChange={setSection} placeholder="e.g. 101"
                  />
                  <FieldInput
                    id="lecture" icon={Hash} label={t('lecture')}
                    value={lecture} onChange={setLecture} placeholder="e.g. 1"
                  />
                  <FieldInput
                    id="duration" icon={Timer}
                    label={`${t('duration')} (${t('minutes')})`}
                    value={duration} onChange={setDuration}
                    type="number" min="1"
                  />
                </div>

                <Button
                  size="default"
                  className="w-full h-10 text-sm font-semibold transition-all"
                  onClick={handleGenerateSession}
                  disabled={!canCreate}
                >
                  {creating ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      جاري الإنشاء...
                    </span>
                  ) : (
                    t('generateAttendance')
                  )}
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="session"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col gap-4"
              >
                {/* Session header card */}
                <div className="glass-card rounded-2xl p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                    <div className="flex items-center gap-2.5">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                      </span>
                      <h2 className="text-base font-bold text-foreground">{course} — {section}</h2>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800">
                      {t('open')}
                    </span>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                    <StatCard
                      icon={<Users className="w-4 h-4 text-primary" />}
                      value={attendeeQuery.data ? `${attendeeQuery.data.present}/${attendeeQuery.data.roster}` : '—'}
                      label={t('attendees')}
                    />
                    <StatCard icon={<Clock className="w-4 h-4 text-orange-500" />} value={formatTime(timeRemaining)} label={t('timeRemaining')} mono />
                    <StatCard icon={<Hash className="w-4 h-4 text-muted-foreground" />} value={lecture} label={t('lecture')} />
                    <StatCard icon={<Timer className="w-4 h-4 text-muted-foreground" />} value={`${duration}m`} label={t('duration')} />
                  </div>

                  {/* Session meta */}
                  {sessionStartTime && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
                      <CalendarClock className="w-3.5 h-3.5" />
                      <span>{t('sessionStartedAt')} {formatClock(sessionStartTime)}</span>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-2">
                    <Button variant="destructive" size="sm" onClick={handleCloseSession} className="flex-1 min-w-[130px] h-9 text-xs">
                      <StopCircle className="w-3.5 h-3.5 mr-1.5 rtl:ml-1.5 rtl:mr-0" />
                      {t('closeAttendance')}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleNewSession} className="flex-1 min-w-[130px] h-9 text-xs">
                      <Plus className="w-3.5 h-3.5 mr-1.5 rtl:ml-1.5 rtl:mr-0" />
                      {t('newSession')}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Right panel — QR ────────────────────────────────────────────────── */}
        <div className="lg:col-span-5">
          <AnimatePresence mode="wait">
            {sessionActive ? (
              <motion.div
                key="qr-active"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.25 }}
                className="glass-card rounded-2xl p-6 flex flex-col items-center text-center"
              >
                {/* Status badge */}
                <div className="flex items-center gap-1.5 mb-4 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800" role="status" aria-live="polite">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-semibold text-green-800 dark:text-green-400">{t('activeSession')}</span>
                </div>

                {/* Token failure warning */}
                {tokenError && (
                  <div className="w-full mb-4 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-3 text-start" role="alert">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                      <p className="flex-1 text-xs font-semibold text-amber-800 dark:text-amber-300 leading-relaxed">
                        {t('qrNotSecured')}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleRetryToken}
                      disabled={retryingToken}
                      className="mt-2.5 h-8 w-full text-xs border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 hover:text-amber-900 dark:hover:text-amber-200"
                    >
                      {retryingToken ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5 rtl:ml-1.5 rtl:mr-0" />
                      ) : (
                        <RefreshCw className="w-3.5 h-3.5 mr-1.5 rtl:ml-1.5 rtl:mr-0" />
                      )}
                      {t('retrySecureQr')}
                    </Button>
                  </div>
                )}

                {/* QR code */}
                <motion.div
                  key={qrTimestamp}
                  initial={{ scale: 0.92, opacity: 0.7 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                  className="relative bg-white p-4 rounded-xl border border-border/50 shadow-md mb-5"
                  ref={qrContainerRef}
                >
                  <div className={`transition-all duration-300 ${qrInsecure ? 'opacity-20 blur-[3px]' : ''}`}>
                    <QRCodeCanvas
                      value={attendanceUrl}
                      size={200}
                      level="H"
                      fgColor="#052e16"
                    />
                  </div>
                  {qrInsecure && (
                    <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
                      <AlertTriangle className="w-9 h-9 text-amber-500" />
                    </div>
                  )}
                </motion.div>

                {/* Refresh bar */}
                <div className="w-full mb-5">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">{t('refreshesIn')}</span>
                    <span className="font-mono font-bold text-primary">{qrRefreshCountdown}s</span>
                  </div>
                  <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-primary rounded-full"
                      animate={{ width: `${(qrRefreshCountdown / 20) * 100}%` }}
                      transition={{ duration: 1, ease: 'linear' }}
                    />
                  </div>
                </div>

                {/* URL row */}
                <div className="w-full flex gap-2 mb-3">
                  <Input
                    readOnly
                    value={attendanceUrl}
                    className="font-mono text-[10px] h-8 bg-background/50 text-muted-foreground"
                  />
                  <Button
                    variant={copyFeedback ? 'default' : 'secondary'}
                    size="icon"
                    className="h-8 w-8 flex-shrink-0 transition-colors"
                    onClick={handleCopy}
                    disabled={qrInsecure}
                    aria-label={t('copyLink')}
                  >
                    <AnimatePresence mode="wait">
                      {copyFeedback ? (
                        <motion.div key="check" initial={{ scale: 0.7 }} animate={{ scale: 1 }} exit={{ scale: 0.7 }}>
                          <CheckCircle className="w-3.5 h-3.5" />
                        </motion.div>
                      ) : (
                        <motion.div key="copy" initial={{ scale: 0.7 }} animate={{ scale: 1 }} exit={{ scale: 0.7 }}>
                          <Copy className="w-3.5 h-3.5" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Button>
                </div>

                {/* Action buttons */}
                <div className="w-full flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-8 text-xs"
                    onClick={handleDownloadQR}
                    disabled={qrInsecure}
                    aria-label={t('downloadQr')}
                  >
                    <Download className="w-3.5 h-3.5 mr-1.5 rtl:ml-1.5 rtl:mr-0" />
                    {t('downloadQr')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-8 text-xs"
                    aria-label={t('generateNewQr')}
                    onClick={() => {
                      setQrTimestamp(Date.now());
                      setQrRefreshCountdown(20);
                      if (generatedAt !== null) void refreshToken(generatedAt, parseInt(duration) || 60);
                    }}
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5 rtl:ml-1.5 rtl:mr-0" />
                    {t('generateNewQr')}
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="qr-inactive"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="glass-card rounded-2xl p-8 flex flex-col items-center justify-center text-center min-h-[320px] border-dashed"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/8 flex items-center justify-center mb-4">
                  <QrCode className="w-7 h-7 text-primary/35" />
                </div>
                {isExpired ? (
                  <p className="text-sm font-semibold text-muted-foreground">{t('sessionEnded')}</p>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-muted-foreground mb-1">{t('noSession')}</p>
                    <p className="text-xs text-muted-foreground/70">{t('fillFormToStart')}</p>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ── Stat card sub-component ────────────────────────────────────────────────────
function StatCard({ icon, value, label, mono = false }: {
  icon: React.ReactNode;
  value: string;
  label: string;
  mono?: boolean;
}) {
  return (
    <div className="bg-background/60 rounded-xl p-3 border flex flex-col items-center justify-center text-center gap-1">
      {icon}
      <span className={`text-xl font-bold text-foreground leading-none ${mono ? 'font-mono' : ''}`}>
        {value}
      </span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}
