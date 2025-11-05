import { useState } from "react";
import Header from "../components/Header";
import Hero from "../components/Hero";
import Features from "../components/Features";
import HowItWorks from "../components/HowItWorks";
import CTA from "../components/CTA";
import Footer from "../components/Footer";
import AuthDialog from "../components/auth/AuthDialog";
import FadeInSection from "../components/ui/FadeInSection";
import { ToastContainer } from "../components/ui/Toast";
import { useToasts } from "../stores/useToasts";

const Index = () => {
    const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
    const [authView, setAuthView] = useState("login"); // "login" or "signup"
    const { toasts, removeToast } = useToasts();
    const openAuthDialog = () => {
        setIsAuthDialogOpen(true);
        setAuthView("login");
    }
    const switchAuthView = (view) => {
        setAuthView(view);
    }
    const closeAuthDialog = () => {
        setIsAuthDialogOpen(false);
    }
    return (
        <div className="min-h-screen">
            {(  isAuthDialogOpen &&
                <AuthDialog closeAuthDialog={closeAuthDialog} view={authView} switchAuthView={switchAuthView} />
            )}
            <Header openAuthDialog={openAuthDialog} switchAuthView={switchAuthView}/>
            <Hero openAuthDialog={openAuthDialog} />
            <FadeInSection direction="right">
                <Features />
            </FadeInSection>
            <FadeInSection>
                <HowItWorks openAuthDialog={openAuthDialog} />
            </FadeInSection>
            <FadeInSection>
                <CTA openAuthDialog={openAuthDialog} switchAuthView={switchAuthView} />
            </FadeInSection>
            <FadeInSection>
                <Footer />
            </FadeInSection>
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </div>
    );
};

export default Index;
