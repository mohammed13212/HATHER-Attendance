import { useEffect, useState } from "react";
import { useSearch } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, Loader2, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/components/providers";
import { config } from "@/config";

export default function Home() {
  const { t, language } = useLanguage();
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  
  const course = searchParams.get("course");
  const section = searchParams.get("section");
  const lecture = searchParams.get("lecture");
  const timestamp = searchParams.get("timestamp");

  const [studentId, setStudentId] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const hasActiveSession = course && section && lecture && timestamp;

  const isValidId = studentId.length === 9 && /^\d+$/.test(studentId);
  const showIdError = studentId.length > 0 && !isValidId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidId || !hasActiveSession) return;

    setStatus("loading");
    setErrorMessage("");

    try {
      const response = await fetch(config.APPS_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors", // Google Apps Script requires no-cors for simple form submissions without preflight issues
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId,
          course,
          section,
          lecture,
          timestamp: new Date().toISOString(),
          sessionTimestamp: timestamp
        }),
      });
      
      // Since it's no-cors, we won't get a readable response. Assume success if it didn't throw.
      setStatus("success");
    } catch (error) {
      console.error("Submission error:", error);
      setStatus("error");
      setErrorMessage(t("error"));
    }
  };

  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 9);
    setStudentId(value);
  };

  if (!hasActiveSession) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="glass-panel overflow-hidden border-destructive/20">
          <CardContent className="pt-8 pb-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-4">
              <Info className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold mb-2 text-foreground">{t("noSession")}</h2>
            <p className="text-muted-foreground">{t("qrValidForSession")}</p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <Card className="glass-panel overflow-hidden shadow-xl border-t-4 border-t-primary">
        <CardHeader className="bg-muted/30 pb-6 border-b border-border/50">
          <CardTitle className="text-2xl">{t("checkIn")}</CardTitle>
          <CardDescription className="text-base mt-2 flex flex-col gap-1">
            <span className="flex items-center gap-2">
              <span className="font-semibold text-foreground">{t("course")}:</span> {course}
            </span>
            <span className="flex items-center gap-2">
              <span className="font-semibold text-foreground">{t("section")}:</span> {section}
            </span>
            <span className="flex items-center gap-2">
              <span className="font-semibold text-foreground">{t("lecture")}:</span> {lecture}
            </span>
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-8">
          <AnimatePresence mode="wait">
            {status === "success" ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center text-center py-6"
              >
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mb-6 shadow-sm">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-2">{t("attendanceSuccess")}</h3>
                <p className="text-muted-foreground mb-1">{t("attendanceSuccessNote")}</p>
                <p className="text-xs text-muted-foreground/70">ID: {studentId}</p>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onSubmit={handleSubmit}
                className="space-y-6"
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              >
                <div className="space-y-3">
                  <Label htmlFor="studentId" className="text-base font-semibold">
                    {t("universityId")}
                  </Label>
                  <div className="relative">
                    <Input
                      id="studentId"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="123456789"
                      value={studentId}
                      onChange={handleIdChange}
                      className={`text-center text-2xl tracking-[0.2em] font-mono h-16 shadow-inner ${
                        showIdError ? "border-destructive focus-visible:ring-destructive" : ""
                      }`}
                      disabled={status === "loading"}
                      autoComplete="off"
                    />
                  </div>
                  <AnimatePresence>
                    {showIdError && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-sm text-destructive flex items-center justify-center gap-1 mt-2"
                      >
                        <AlertCircle className="w-4 h-4" />
                        {t("invalidId")}
                      </motion.p>
                    )}
                  </AnimatePresence>
                  
                  {status === "error" && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-sm text-destructive flex items-center justify-center gap-1 mt-2 bg-destructive/10 p-3 rounded-lg"
                    >
                      <AlertCircle className="w-4 h-4" />
                      {errorMessage}
                    </motion.p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-14 text-lg mt-4 shadow-lg shadow-primary/20"
                  disabled={!isValidId || status === "loading"}
                >
                  {status === "loading" ? (
                    <>
                      <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                      {t("loading")}
                    </>
                  ) : (
                    t("checkIn")
                  )}
                </Button>
              </motion.form>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}
