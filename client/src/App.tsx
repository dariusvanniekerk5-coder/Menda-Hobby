import { Switch, Route } from "wouter";
import { AppProvider } from "./lib/store";
import { Toaster } from "@/components/ui/toaster";
import Layout from "@/components/layout";
import Chatbot from "@/components/chatbot";
import Landing from "@/pages/landing";
import Auth from "@/pages/auth";
import CustomerHome from "@/pages/customer/home";
import CustomerJobs from "@/pages/customer/jobs";
import CustomerJobDetails from "@/pages/customer/job-details";
import CustomerBook from "@/pages/customer/book";
import ProviderJobs from "@/pages/provider/jobs";
import ProviderJobDetails from "@/pages/provider/job-details";
import ProviderEarnings from "@/pages/provider/earnings";
import ProviderSignup from "@/pages/provider/signup";
import NotFound from "@/pages/not-found";
import PaymentSuccess from "@/pages/payment-success";
import PaymentCancelled from "@/pages/payment-cancelled";
import {
  CustomerProfile,
  ProviderProfile,
  AdminDashboard,
  AdminProviders,
  AdminJobs
} from "@/pages/placeholders";

const Router = () => (
  <Layout>
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/auth" component={Auth} />
      <Route path="/auth/:role" component={Auth} />
      <Route path="/customer/home" component={CustomerHome} />
      <Route path="/customer/jobs" component={CustomerJobs} />
      <Route path="/customer/profile" component={CustomerProfile} />
      <Route path="/customer/job/:id" component={CustomerJobDetails} />
      <Route path="/customer/book/:serviceId" component={CustomerBook} />
      <Route path="/provider/jobs" component={ProviderJobs} />
      <Route path="/provider/earnings" component={ProviderEarnings} />
      <Route path="/provider/profile" component={ProviderProfile} />
      <Route path="/provider/job/:id" component={ProviderJobDetails} />
      <Route path="/provider/signup" component={ProviderSignup} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/providers" component={AdminProviders} />
      <Route path="/admin/jobs" component={AdminJobs} />
      <Route path="/payment/success" component={PaymentSuccess} />
      <Route path="/payment/cancelled" component={PaymentCancelled} />
      <Route component={NotFound} />
    </Switch>
  </Layout>
);

export default function App() {
  return (
    <AppProvider>
      <Toaster />
      <Router />
      <Chatbot />
    </AppProvider>
  );
}
