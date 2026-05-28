import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import CategoriesSection from "@/components/landing/categories-section";
import FeaturedListings from "@/components/landing/FeaturedListings";
import WhyPlanneo from "@/components/landing/WhyPlanneo";
import Testimonials from "@/components/landing/Testimonials";
import CTABanner from "@/components/landing/CTABanner";
import GuidesSection from "@/components/landing/GuidesSection";
import Footer from "@/components/landing/Footer";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <CategoriesSection />
        <HowItWorks />
        <FeaturedListings />
        <WhyPlanneo />
        <CTABanner />
        <Testimonials />
        <GuidesSection />
      </main>
      <Footer />
    </>
  );
}
