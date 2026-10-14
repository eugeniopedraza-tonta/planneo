import type { Metadata } from "next";
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import CategoriesSection from "@/components/landing/categories-section";
import FeaturedListings from "@/components/landing/FeaturedListings";
import WhyPlanneo from "@/components/landing/WhyPlanneo";
import Testimonials from "@/components/landing/Testimonials";
import CTABanner from "@/components/landing/CTABanner";
import Footer from "@/components/landing/Footer";
import PageEvent from "@/components/analytics/page-event";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Planneo — Proveedores para eventos en Monterrey",
  description:
    "Encuentra fotógrafos, DJ, salones, catering y más para tu boda, XV años o evento corporativo en Monterrey.",
  path: "/",
  absoluteTitle: true,
});

export default function HomePage() {
  return (
    <>
      <PageEvent name="home_view" />
      <Navbar />
      <main>
        <Hero />
        <CategoriesSection />
        <HowItWorks />
        <FeaturedListings />
        <WhyPlanneo />
        <CTABanner />
        <Testimonials />
        {/* Diario: guías sin enlace todavía. Vuelve cuando exista /diario (PLA-21). */}
      </main>
      <Footer />
    </>
  );
}
