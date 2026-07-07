import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { ThemeProvider, LanguageProvider } from '@/components/providers';
import { Header, Footer } from '@/components/layout';
import Home from '@/pages/home';
import Instructor from '@/pages/instructor';

const queryClient = new QueryClient();

function Router() {
  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden bg-background">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-96 bg-primary/5 rounded-b-[100%] pointer-events-none transform -translate-y-1/2 scale-150 z-0"></div>
      
      <Header />
      
      <main className="flex-1 w-full max-w-lg mx-auto px-6 py-8 md:py-12 z-10 flex flex-col justify-center">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/instructor" component={Instructor} />
          <Route component={NotFound} />
        </Switch>
      </main>

      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <LanguageProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
              <Router />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
