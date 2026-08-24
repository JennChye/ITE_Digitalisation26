/** Hawker Market Journal style: light theme routing for the food journal home and meal detail pages. */
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import DailyHistory from "./pages/DailyHistory";
import CustomMealEstimator from "./pages/CustomMealEstimator";
import LogMeal from "./pages/LogMeal";
import MealDetail from "./pages/MealDetail";
import StudentCommunity from "./pages/StudentCommunity";
import CommunitySafety from "./pages/CommunitySafety";
import TeacherModeration from "./pages/TeacherModeration";
import BadgeCollection from "./pages/BadgeCollection";
import MonthlyReflection from "./pages/MonthlyReflection";
function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/meal/:id" component={MealDetail} />
      <Route path="/log" component={LogMeal} />
      <Route path="/custom-estimate" component={CustomMealEstimator} />
      <Route path="/history" component={DailyHistory} />
      <Route path="/community" component={StudentCommunity} />
      <Route path="/community-safety" component={CommunitySafety} />
      <Route path="/teacher-moderation" component={TeacherModeration} />
      <Route path="/badges" component={BadgeCollection} />
      <Route path="/reflection" component={MonthlyReflection} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
