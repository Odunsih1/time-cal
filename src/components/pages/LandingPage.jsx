import React from "react";
import Header from "../layout/Header";
import Footer from "../layout/Footer";
import Hero from "../ui/Hero";
import HowItWorks from "../ui/HowItWorks";
import Ready from "../ui/Ready";

const LandingPage = () => {
  return (
    <>
      <Header />
      <main>
        {/* HERO */}
        <Hero />
        {/* HOW IT WORKS */}
        <HowItWorks />
        {/* READY */}
        <Ready />
      </main>
      <Footer />
    </>
  );
};

export default LandingPage;
