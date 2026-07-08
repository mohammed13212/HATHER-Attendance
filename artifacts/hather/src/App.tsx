import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { ThemeProvider, LanguageProvider } from '@/components/providers';
import { Header, Footer } from '@/components/layout';
import Home from '@/pages/home';
import Teacher from '@/pages/teacher';
import Admin from '@/pages/admin';

const queryClient = new QueryClient();

function Router() {
  return (
    <div className="flex flex-col min-h-[100dvh] relative overflow-hidden bg-background">
      <Switch>
        <Route path="/admin">
          <Admin />
        </Route>
        
        <Route path="/teacher">
          <Header />
          <main className="flex-1 w-full z-10 flex flex-col relative px-4 py-8">
            <Teacher />
          </main>
          <Footer />
        </Route>
        
        <Route path="/">
          <Home />
        </Route>
        
        <Route>
          <Header />
          <NotFound />
          <Footer />
        </Route>
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <LanguageProvider defaultLanguage="ar">
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
