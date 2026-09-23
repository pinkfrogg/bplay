import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import OpeningLoader from "@/components/OpeningLoader";
import PixieTrail from "@/components/PixieTrail";
import NotFound from "@/pages/NotFound";
import { Redirect, Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import AlbumPage from "./pages/AlbumPage";
import AdminPage from "./pages/AdminPage";
import Home from "./pages/Home";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/intro-preview"}><Redirect to="/" replace /></Route>
      <Route path={"/admin"} component={AdminPage} />
      <Route path={"/albums/:albumId"} component={AlbumPage} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <TooltipProvider>
        <Toaster />
        <OpeningLoader />
        <PixieTrail />
        <Router />
      </TooltipProvider>
    </ErrorBoundary>
  );
}

export default App;
