import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Download, Copy, RefreshCw, CheckCircle2, LogOut } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/components/providers";
import { config } from "@/config";
import { QRCodeSVG } from "qrcode.react";

export default function Instructor() {
  const { t, language } = useLanguage();
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);

  const [course, setCourse] = useState("");
  const [section, setSection] = useState("");
  const [lecture, setLecture] = useState("");
  
  const [generatedUrl, setGeneratedUrl] = useState("");
  const [copied, setCopied] = useState(false);
  
  const qrRef = useRef<SVGSVGElement>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === config.INSTRUCTOR_PASSWORD) {
      setIsAuthenticated(true);
      setPasswordError(false);
    } else {
      setPasswordError(true);
    }
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!course || !section || !lecture) return;

    const timestamp = Date.now().toString();
    // Use BASE_URL so links work correctly on GitHub Pages subpath deployments
    // (e.g. https://user.github.io/hather/?course=... instead of just origin/?course=...)
    const base = window.location.origin + (import.meta.env.BASE_URL || "/");
    const url = new URL(base);
    url.searchParams.set("course", course);
    url.searchParams.set("section", section);
    url.searchParams.set("lecture", lecture);
    url.searchParams.set("timestamp", timestamp);
    
    setGeneratedUrl(url.toString());
    setCopied(false);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(generatedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleDownloadQr = () => {
    if (!qrRef.current) return;
    
    const svg = qrRef.current;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width + 40; // Add padding
      canvas.height = img.height + 40;
      
      if (ctx) {
        // Fill white background
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // Draw image centered
        ctx.drawImage(img, 20, 20);
        
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = `QR_${course}_Sec${section}_Lec${lecture}.png`;
        downloadLink.href = `${pngFile}`;
        downloadLink.click();
      }
    };
    
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handleReset = () => {
    setCourse("");
    setSection("");
    setLecture("");
    setGeneratedUrl("");
  };

  if (!isAuthenticated) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md mx-auto"
      >
        <Card className="glass-panel shadow-xl overflow-hidden border-t-4 border-t-primary">
          <CardHeader className="bg-muted/30 pb-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
              <Lock className="w-8 h-8" />
            </div>
            <CardTitle className="text-2xl">{t("instructorPanel")}</CardTitle>
          </CardHeader>
          <CardContent className="pt-8">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="password">{t("password")}</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError(false);
                  }}
                  className={passwordError ? "border-destructive" : ""}
                  autoFocus
                />
                {passwordError && (
                  <p className="text-sm text-destructive">{t("error")}</p>
                )}
              </div>
              <Button type="submit" className="w-full h-12 text-base">
                {t("enterPanel")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto"
    >
      <Card className="glass-panel shadow-xl overflow-hidden">
        <CardHeader className="bg-muted/30 pb-6 border-b border-border/50 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl">{t("instructorPanel")}</CardTitle>
            <CardDescription className="text-base mt-1">Generate attendance QR code</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsAuthenticated(false)}>
            <LogOut className="w-5 h-5 text-muted-foreground" />
          </Button>
        </CardHeader>
        
        <CardContent className="pt-8">
          {!generatedUrl ? (
            <motion.form
              key="generator"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleGenerate}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3 md:col-span-2">
                  <Label htmlFor="course" className="text-base">{t("course")}</Label>
                  <Input
                    id="course"
                    placeholder="e.g. CS101 - Introduction to Programming"
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    required
                    className="h-12 text-lg"
                  />
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="section" className="text-base">{t("section")}</Label>
                  <Input
                    id="section"
                    placeholder="e.g. A, B1"
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    required
                    className="h-12 text-lg uppercase"
                  />
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="lecture" className="text-base">{t("lecture")}</Label>
                  <Input
                    id="lecture"
                    placeholder="e.g. L1, 3"
                    value={lecture}
                    onChange={(e) => setLecture(e.target.value)}
                    required
                    className="h-12 text-lg"
                  />
                </div>
              </div>
              
              <Button type="submit" className="w-full h-14 text-lg mt-4 shadow-md">
                {t("generateQr")}
              </Button>
            </motion.form>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center text-center space-y-8"
            >
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-border inline-block">
                <QRCodeSVG
                  value={generatedUrl}
                  size={256}
                  level="H"
                  includeMargin={true}
                  className="mx-auto"
                  ref={qrRef}
                />
              </div>
              
              <div className="space-y-2 w-full max-w-md">
                <p className="text-sm font-medium text-muted-foreground">{t("qrValidForSession")}</p>
                
                <div className="flex items-center gap-2 mt-4">
                  <Input 
                    value={generatedUrl}
                    readOnly
                    className="h-12 font-mono text-sm bg-muted/50 cursor-copy"
                    onClick={handleCopyLink}
                  />
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-12 w-12 shrink-0"
                    onClick={handleCopyLink}
                  >
                    {copied ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                  </Button>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md pt-4">
                <Button 
                  onClick={handleDownloadQr} 
                  className="flex-1 h-12"
                  variant="default"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {t("downloadQr")}
                </Button>
                <Button 
                  onClick={handleReset} 
                  className="flex-1 h-12"
                  variant="outline"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {t("reset")}
                </Button>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
