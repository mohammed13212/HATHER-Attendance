import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, ArrowRight, Copy, RefreshCw, StopCircle, Download, Plus, CheckCircle, Users, Clock } from 'lucide-react';
import { useLanguage } from '@/components/providers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Teacher() {
  const { t, language } = useLanguage();
  const [, setLocation] = useLocation();
  
  const [course, setCourse] = useState('');
  const [section, setSection] = useState('');
  const [lecture, setLecture] = useState('');
  const [duration, setDuration] = useState('60');
  
  const [sessionActive, setSessionActive] = useState(false);
  const [attendeeCount, setAttendeeCount] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0); // in seconds
  const [qrTimestamp, setQrTimestamp] = useState(Date.now());
  const [qrRefreshCountdown, setQrRefreshCountdown] = useState(20);

  // Auto-increment attendees while session is active
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (sessionActive) {
      interval = setInterval(() => {
        setAttendeeCount(prev => prev + Math.floor(Math.random() * 3)); // Randomly add 0-2 attendees
      }, 8000);
    }
    return () => clearInterval(interval);
  }, [sessionActive]);

  // Session time remaining
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (sessionActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
    } else if (sessionActive && timeRemaining === 0) {
      setSessionActive(false);
    }
    return () => clearInterval(interval);
  }, [sessionActive, timeRemaining]);

  // QR refresh countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (sessionActive) {
      interval = setInterval(() => {
        setQrRefreshCountdown(prev => {
          if (prev <= 1) {
            setQrTimestamp(Date.now());
            return 20;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [sessionActive]);

  const handleGenerateSession = () => {
    if (!course || !section || !lecture || !duration) return;
    setAttendeeCount(0);
    setTimeRemaining(parseInt(duration) * 60);
    setQrRefreshCountdown(20);
    setQrTimestamp(Date.now());
    setSessionActive(true);
  };

  const handleCloseSession = () => {
    setSessionActive(false);
  };

  const handleNewSession = () => {
    setSessionActive(false);
    setCourse('');
    setSection('');
    setLecture('');
    setDuration('60');
    setAttendeeCount(0);
  };

  const attendanceUrl = `${window.location.origin}${import.meta.env.BASE_URL}?course=${encodeURIComponent(course)}&section=${encodeURIComponent(section)}&lecture=${encodeURIComponent(lecture)}&ts=${qrTimestamp}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(attendanceUrl);
    // Could add toast here
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="w-full max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="sm" onClick={() => setLocation('/')} className="text-muted-foreground hover:text-foreground">
          {language === 'ar' ? <ArrowRight className="w-4 h-4 ml-2" /> : <ArrowLeft className="w-4 h-4 mr-2" />}
          {t('back')}
        </Button>
        <h1 className="text-3xl font-bold text-foreground">
          {t('dashboard')}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Panel */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {!sessionActive ? (
            <div className="glass-card p-6 md:p-8 rounded-2xl">
              <h2 className="text-xl font-bold mb-6 text-foreground">{t('newSession')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-2">
                  <Label htmlFor="course">{t('course')}</Label>
                  <Input id="course" value={course} onChange={e => setCourse(e.target.value)} placeholder="e.g. CS101" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="section">{t('section')}</Label>
                  <Input id="section" value={section} onChange={e => setSection(e.target.value)} placeholder="e.g. 101" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lecture">{t('lecture')}</Label>
                  <Input id="lecture" value={lecture} onChange={e => setLecture(e.target.value)} placeholder="e.g. 1" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">{t('duration')} ({t('minutes')})</Label>
                  <Input id="duration" type="number" value={duration} onChange={e => setDuration(e.target.value)} min="1" />
                </div>
              </div>
              <Button 
                size="lg" 
                className="w-full text-lg h-14" 
                onClick={handleGenerateSession}
                disabled={!course || !section || !lecture || !duration}
              >
                {t('generateAttendance')}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="glass-card p-6 rounded-2xl">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <span className="flex h-3 w-3 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    <h2 className="text-xl font-bold text-foreground">{course} - {section}</h2>
                  </div>
                  <div className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800">
                    {t('open')}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-background/50 rounded-xl p-4 border flex flex-col items-center justify-center text-center">
                    <Users className="w-6 h-6 text-primary mb-2" />
                    <span className="text-3xl font-bold text-foreground">{attendeeCount}</span>
                    <span className="text-xs text-muted-foreground mt-1">{t('attendees')}</span>
                  </div>
                  <div className="bg-background/50 rounded-xl p-4 border flex flex-col items-center justify-center text-center">
                    <Clock className="w-6 h-6 text-orange-500 mb-2" />
                    <span className="text-3xl font-bold text-foreground font-mono">{formatTime(timeRemaining)}</span>
                    <span className="text-xs text-muted-foreground mt-1">{t('timeRemaining')}</span>
                  </div>
                  <div className="bg-background/50 rounded-xl p-4 border flex flex-col items-center justify-center text-center">
                    <span className="text-sm font-medium text-foreground mb-1">{t('lecture')}</span>
                    <span className="text-2xl font-bold text-primary">{lecture}</span>
                  </div>
                  <div className="bg-background/50 rounded-xl p-4 border flex flex-col items-center justify-center text-center">
                    <span className="text-sm font-medium text-foreground mb-1">{t('duration')}</span>
                    <span className="text-2xl font-bold text-primary">{duration}m</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button variant="destructive" onClick={handleCloseSession} className="flex-1 min-w-[140px]">
                    <StopCircle className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
                    {t('closeAttendance')}
                  </Button>
                  <Button variant="outline" className="flex-1 min-w-[140px]">
                    <Download className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
                    {t('downloadReport')}
                  </Button>
                  <Button variant="outline" onClick={handleNewSession} className="flex-1 min-w-[140px]">
                    <Plus className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
                    {t('newSession')}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - QR Code */}
        <div className="lg:col-span-5">
          <AnimatePresence mode="wait">
            {sessionActive ? (
              <motion.div 
                key="qr-active"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-card rounded-2xl p-8 flex flex-col items-center justify-center text-center h-full min-h-[500px]"
              >
                <motion.div 
                  key={qrTimestamp}
                  initial={{ scale: 0.9, opacity: 0.8 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="bg-white p-6 rounded-2xl border-4 border-primary/20 shadow-xl mb-8"
                >
                  <QRCodeSVG 
                    value={attendanceUrl}
                    size={280}
                    level="H"
                    fgColor="#052e16" // Dark green
                  />
                </motion.div>

                <div className="w-full max-w-xs mb-8">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">{t('refreshesIn')}</span>
                    <span className="font-bold text-primary font-mono">{qrRefreshCountdown}s</span>
                  </div>
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-primary"
                      initial={{ width: '100%' }}
                      animate={{ width: `${(qrRefreshCountdown / 20) * 100}%` }}
                      transition={{ duration: 1, ease: "linear" }}
                    />
                  </div>
                </div>

                <div className="w-full flex gap-2 mb-4">
                  <Input readOnly value={attendanceUrl} className="font-mono text-xs bg-background/50" />
                  <Button variant="secondary" size="icon" onClick={copyToClipboard} title={t('copyLink')}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>

                <Button variant="outline" className="w-full" onClick={() => {
                  setQrTimestamp(Date.now());
                  setQrRefreshCountdown(20);
                }}>
                  <RefreshCw className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
                  {t('generateNewQr')}
                </Button>
              </motion.div>
            ) : (
              <motion.div 
                key="qr-inactive"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-card rounded-2xl p-8 flex flex-col items-center justify-center text-center h-full min-h-[500px] border-dashed"
              >
                <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <RefreshCw className="w-12 h-12 text-primary/30" />
                </div>
                <h3 className="text-lg font-semibold text-muted-foreground">{t('noSession')}</h3>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
