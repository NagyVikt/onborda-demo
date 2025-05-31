"use client";

// React
import React, { useState } from "react"; // Explicitly import React for clarity

// Next
import Link from "next/link";

// Onborda - Assuming this is for a product tour feature.
// If not used, you might consider removing it to simplify.
import { useOnborda } from "onborda";

// shadcn/ui
import { Button } from "@/components/ui/button";
// Accordion for FAQ
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";


// Icons
import {
  Sparkles, BookOpen, ExternalLink, PlayCircle, Zap, Users, CheckCircle,
  CalendarDays, Mail, Sun, Moon, Utensils, Scissors, Stethoscope, Briefcase,
  MessageSquare, ShieldCheck, BarChart3, Settings2, UserCheck, Star, HelpCircle,
  ArrowRight, Phone, MapPin
} from "lucide-react";

// Components - Assuming these are part of your project structure
import Provider from "@/components/Code/Provider"; // Example component
import Pointer from "@/components/Code/Pointer";   // Example component
import Steps from "@/components/Code/Steps";       // Example component
import Features from "@/components/Features";     // Example component
import ModeToggle from "@/components/ModeToggle"; // Dark/Light mode toggle

// Placeholder for a Logo component
const Logo = () => (
  <Link href="/" className="flex items-center space-x-2">
    {/* You can use an SVG logo here if you have one */}
    <Sparkles className="h-7 w-7 text-primary dark:text-primary-dark" />
    <span className="text-2xl font-bold">Szabadvok.hu</span>
  </Link>
);

// Placeholder for Trustpilot-like stars
const TrustpilotStars = ({ rating = 5.0, reviewCount }: { rating?: number, reviewCount?: number }) => (
  <div className="flex items-center space-x-1">
    {[...Array(5)].map((_, i) => (
      <Star key={i} className={`w-5 h-5 ${i < Math.floor(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} />
    ))}
    <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
      {rating.toFixed(1)}
      {reviewCount && ` based on ${reviewCount} reviews`}
    </span>
  </div>
);

// Interface for business type options
interface BusinessTypeOption {
  id: string;
  name: string;
  icon: React.ElementType;
  heroTitle: string;
  heroSubtitle: string;
  heroDescription: string;
  appPreview: {
    icon: React.ElementType;
    title: string;
    description: string;
    detailsTitle?: string;
    details?: string[];
  };
}

// Default content for when no business type is selected
const defaultContent: Omit<BusinessTypeOption, 'id' | 'name' | 'icon'> = {
  heroTitle: "Van egy vállalkozásod, és szeretnéd, ha az időpontfoglalás egyszerű lenne?",
  heroSubtitle: "A ELSŐ HAZAI IDŐPONTFOGLALÓ ÉTTERMEKNEK, FODRÁSZATOKNAK ÉS VÁLLALKOZÁSOKNAK",
  heroDescription: "Bízd ránk az időpontfoglalást, és koncentrálj arra, ami igazán fontos: a vállalkozásodra. Rendszerünk segít neked egyszerűsíteni az időpontfoglalást, hogy több időd maradjon a növekedésre.",
  appPreview: {
    icon: CalendarDays,
    title: "Alkalmazás Előnézet",
    description: "Képzeld el itt a gyönyörű, személyre szabott időpontfoglaló felületedet.",
    detailsTitle: "Általános Nyitvatartás",
    details: ["H-P: 9:00 - 17:00", "30 perces és 1 órás időpontok"],
  }
};

// Business type definitions
const businessTypes: BusinessTypeOption[] = [
  {
    id: "restaurant",
    name: "Étterem",
    icon: Utensils,
    heroTitle: "Éttermed van? Forradalmasítsd az asztalfoglalást!",
    heroSubtitle: "ONLINE ASZTALFOGLALÁS ÉTTERMEK SZÁMÁRA",
    heroDescription: "Modernizáld éttermed működését egy intelligens asztalfoglaló rendszerrel. Kevesebb adminisztráció, több elégedett vendég!",
    appPreview: {
      icon: Utensils,
      title: "Éttermi Foglalási Rendszer",
      description: "Tekintsd meg, hogyan láthatják vendégeid az éttermed felhasználóbarát foglalási felületét.",
      detailsTitle: "Nyitvatartás és Foglalás",
      details: ["H-V: 12:00 - 23:00", "Online asztalfoglalás éjjel-nappal"],
    }
  },
  {
    id: "salon",
    name: "Fodrászat / Szépségszalon",
    icon: Scissors,
    heroTitle: "Szalonod van? Adj vendégeidnek kényelmes online időpontfoglalást!",
    heroSubtitle: "IDŐPONTFOGLALÁS FODRÁSZATOKNAK ÉS SZÉPSÉGSZALONOKNAK",
    heroDescription: "Növeld szalonod hatékonyságát és vendégeid elégedettségét egy egyszerűen használható online naptárral, ami éjjel-nappal elérhető.",
    appPreview: {
      icon: Scissors,
      title: "Szalon Időpontkezelő",
      description: "Mutasd be szalonod elegáns és felhasználóbarát online naptárát.",
      detailsTitle: "Elérhető Időpontok",
      details: ["K-P: 08:00 - 20:00", "Szo: 09:00 - 16:00"],
    }
  },
  {
    id: "clinic",
    name: "Orvosi Rendelő / Klinika",
    icon: Stethoscope,
    heroTitle: "Rendelőd van? Egyszerűsítsd a páciensbejelentkezést!",
    heroSubtitle: "ONLINE BEJELENTKEZÉS ORVOSI RENDELŐKNEK ÉS KLINIKÁKNAK",
    heroDescription: "Optimalizáld rendelőd időbeosztását és csökkentsd a várakozási időt egy modern online időpontfoglaló rendszerrel. Több idő a páciensekre, kevesebb papírmunka.",
    appPreview: {
      icon: Stethoscope,
      title: "Páciens Portál Előnézet",
      description: "Így néz ki egy modern, páciensbarát online bejelentkezési felület, amely megkönnyíti az adminisztrációt.",
      detailsTitle: "Rendelési Idő",
      details: ["H-P: 08:00 - 18:00", "Időpontfoglalás telefonon és online"],
    }
  },
  {
    id: "other",
    name: "Egyéb Szolgáltatás",
    icon: Briefcase,
    heroTitle: "Szolgáltatásod van? Kezeld egyszerűbben az ügyfélidőpontokat!",
    heroSubtitle: "IDŐPONTFOGLALÁS KÜLÖNBÖZŐ SZOLGÁLTATÁSOKNAK",
    heroDescription: "Legyen szó tanácsadásról, oktatásról, coachingról vagy bármilyen személyes szolgáltatásról, rendszerünkkel könnyedén menedzselheted foglalásaidat.",
    appPreview: {
      icon: Briefcase,
      title: "Általános Időpontfoglaló",
      description: "Rugalmas és testreszabható időpontfoglalási felület bármilyen típusú vállalkozás számára.",
      detailsTitle: "Általános Elérhetőség",
      details: ["Egyeztetés szerint", "Online foglalás bármikor"],
    }
  }
];

// FAQ Data
const faqItems = [
  {
    value: "item-1",
    question: "Hogyan működik az időpontfoglaló rendszer?",
    answer: "Rendszerünk egy felhasználóbarát felületet biztosít, ahol ügyfelei könnyedén megtekinthetik szabad időpontjait és lefoglalhatják a számukra megfelelőt. Ön valós időben értesül a foglalásokról és kezelheti naptárát."
  },
  {
    value: "item-2",
    question: "Milyen típusú vállalkozásoknak ajánlott?",
    answer: "Szinte bármilyen szolgáltatás alapú vállalkozásnak, ahol az ügyfeleknek időpontot kell foglalniuk. Például éttermek, fodrászatok, szépségszalonok, orvosi rendelők, masszázs stúdiók, tanácsadók, edzőtermek stb."
  },
  {
    value: "item-3",
    question: "Testreszabható a rendszer a vállalkozásom arculatához?",
    answer: "Igen, lehetőséget biztosítunk a foglalási felület alapvető testreszabására, hogy illeszkedjen vállalkozása megjelenéséhez."
  },
  {
    value: "item-4",
    question: "Van ingyenes próbaidőszak?",
    answer: "Kínálunk ingyenes csomagot korlátozott funkciókkal, valamint prémium csomagjainkhoz is biztosíthatunk próbaidőszakot. Kérjük, vegye fel velünk a kapcsolatot a részletekért."
  }
];

// Testimonial Data
const testimonials = [
  {
    quote: "Mióta a Szabadvok.hu-t használjuk, jelentősen csökkent az adminisztrációs terhünk és vendégeink imádják, hogy online foglalhatnak.",
    name: "Nagy Anna",
    role: "Étterem Tulajdonos, Harmónia Étterem",
    avatar: UserCheck // Placeholder icon
  },
  {
    quote: "A legjobb döntés volt váltani erre a rendszerre. Átlátható, könnyen kezelhető és a vendégeim is szeretik. Csak ajánlani tudom!",
    name: "Kovács Béla",
    role: "Fodrász Mester, Stílus Szalon",
    avatar: UserCheck // Placeholder icon
  },
  {
    quote: "Pácienseink számára sokkal kényelmesebb lett a bejelentkezés. A rendszer megbízható és segít optimalizálni a rendelési időnket.",
    name: "Dr. Kiss Zsuzsanna",
    role: "Fogorvos, DentalCare Klinika",
    avatar: UserCheck // Placeholder icon
  }
];


export default function HomePage() {
  // Onborda hook - for product tour
  const { startOnborda } = useOnborda(); // Call this function to start the tour

  // State for selected business type
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessTypeOption | null>(null);

  // Dynamically set content based on selected business type or default
  const currentHeroTitle = selectedBusiness?.heroTitle || defaultContent.heroTitle;
  const currentHeroSubtitle = selectedBusiness?.heroSubtitle || defaultContent.heroSubtitle;
  const currentHeroDescription = selectedBusiness?.heroDescription || defaultContent.heroDescription;

  const AppPreviewIcon = selectedBusiness?.appPreview.icon || defaultContent.appPreview.icon;
  const currentAppPreviewTitle = selectedBusiness?.appPreview.title || defaultContent.appPreview.title;
  const currentAppPreviewDescription = selectedBusiness?.appPreview.description || defaultContent.appPreview.description;
  const currentAppPreviewDetailsTitle = selectedBusiness?.appPreview.detailsTitle || defaultContent.appPreview.detailsTitle;
  const currentAppPreviewDetails = selectedBusiness?.appPreview.details || defaultContent.appPreview.details;

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-sans"> {/* Added font-sans for consistency */}
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
        <div className="container mx-auto h-16 flex items-center justify-between px-4 md:px-6">
          <Logo />
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <Link href="#features" className="hover:text-primary dark:hover:text-primary-dark transition-colors">Funkciók</Link>
            <Link href="#howitworks" className="hover:text-primary dark:hover:text-primary-dark transition-colors">Hogyan Működik?</Link>
            <Link href="#pricing" className="hover:text-primary dark:hover:text-primary-dark transition-colors">Árak</Link> {/* Assuming a pricing section might exist */}
            <Link href="#faq" className="hover:text-primary dark:hover:text-primary-dark transition-colors">GYIK</Link>
            {/* <Link href="#" className="hover:text-primary dark:hover:text-primary-dark">Docs</Link> */}
          </nav>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex">Bejelentkezés</Button>
            <Button size="sm" onClick={() => console.log("Sign Up Clicked")}>Ingyenes Regisztráció</Button>
            <ModeToggle />
            {/* Button to trigger Onborda tour - example */}
            {/* <Button variant="outline" size="icon" onClick={startOnborda} className="ml-2" aria-label="Start Tour">
              <PlayCircle className="h-5 w-5" />
            </Button> */}
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {/* Business Type Selector Section */}
        <section className="py-12 md:py-16 bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800">
          <div className="container mx-auto px-4 md:px-6">
            <h2 className="text-2xl sm:text-3xl font-semibold text-center mb-8 text-gray-800 dark:text-gray-100">
              Kérlek, válaszd ki a vállalkozásod típusát:
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {businessTypes.map((option) => (
                <Button
                  key={option.id}
                  variant={selectedBusiness?.id === option.id ? "default" : "outline"}
                  size="lg"
                  onClick={() => setSelectedBusiness(option)}
                  className={`w-full flex items-center justify-center py-4 text-base ${selectedBusiness?.id === option.id ? 'ring-2 ring-primary dark:ring-primary-dark' : ''}`}
                >
                  <option.icon className="mr-3 h-6 w-6" />
                  {option.name}
                </Button>
              ))}
            </div>
          </div>
        </section>

        {/* Hero Section - Onborda Step 1 (if using Onborda) */}
        <section
          id="onborda-step1" // For Onborda tour step
          className="py-16 md:py-24 lg:py-32 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900/30"
        >
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* Left Column: Text Content */}
              <div className="space-y-6">
                <p className="text-sm font-semibold text-primary dark:text-primary-dark tracking-wide uppercase">
                  {currentHeroSubtitle}
                </p>
                {/* Onborda Step 3: Main Title (if using Onborda) */}
                <h1 id="onborda-step3" className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 dark:text-white">
                  {currentHeroTitle}
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400 max-w-xl">
                  {currentHeroDescription}
                </p>
                {/* Onborda Step 2: Sign-up Buttons (if using Onborda) */}
                <div id="onborda-step2" className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button size="lg" className="w-full sm:w-auto shadow-lg hover:shadow-xl transition-shadow">
                    <Mail className="mr-2 h-5 w-5" /> Ingyenes Regisztráció
                  </Button>
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    Tudj meg többet <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
                <div className="pt-6"> {/* Increased padding */}
                  <TrustpilotStars rating={4.9} reviewCount={125} /> {/* Example with props */}
                </div>
              </div>

              {/* Right Column: UI Mockup Placeholder - Onborda Step 4 (if using Onborda) */}
              <div
                id="onborda-step4"
                className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl shadow-2xl min-h-[350px] md:min-h-[450px] flex flex-col items-center justify-center border border-gray-200 dark:border-gray-700"
              >
                <AppPreviewIcon className="w-20 h-20 md:w-28 md:h-28 text-primary dark:text-primary-dark opacity-60 mb-6" />
                <p className="text-xl sm:text-2xl font-semibold text-gray-700 dark:text-gray-300 text-center">{currentAppPreviewTitle}</p>
                <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 text-center mt-2 max-w-xs">
                  {currentAppPreviewDescription}
                </p>
                {currentAppPreviewDetailsTitle && currentAppPreviewDetails && currentAppPreviewDetails.length > 0 && (
                 <div className="mt-6 p-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg w-full max-w-xs">
                    <h4 className="text-sm font-medium text-center text-gray-700 dark:text-gray-300 mb-2">{currentAppPreviewDetailsTitle}</h4>
                    <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 space-y-1">
                        {currentAppPreviewDetails.map((detail, index) => (
                           <p key={index} className="text-center">{detail}</p>
                        ))}
                    </div>
                 </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Client Logo Bar - Onborda Step 5 (if using Onborda) */}
        <section id="onborda-step5" className="py-12 bg-white dark:bg-gray-900">
          <div className="container mx-auto px-4 md:px-6">
            <h2 className="text-center text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-8">
              Már velünk tartanak ezek a előremutató vállalkozások
            </h2>
            <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-6 md:gap-x-12 lg:gap-x-16">
              {["Partner Cég 1", "Innovatív Kft.", "Szuper Szalon", "Modern Rendelő", "Profi Mester", "NextGen Kft."].map((logoText) => (
                <div key={logoText} className="text-gray-400 dark:text-gray-500 text-xl font-medium opacity-75 hover:opacity-100 transition-opacity">
                  {logoText} {/* Replace with actual logos if available */}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section - NEW */}
        <section id="howitworks" className="py-16 md:py-24 bg-gray-50 dark:bg-gray-950">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">Hogyan Működik?</h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">Egyszerű lépések a hatékonyabb időpontkezeléshez.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: Settings2, title: "Regisztráció és Beállítás", description: "Hozd létre fiókodat percek alatt, add meg szolgáltatásaidat és elérhetőségeidet." },
                { icon: CalendarDays, title: "Oszd meg a Foglalási Oldalad", description: "Integráld weboldaladba vagy oszd meg közvetlenül ügyfeleiddel egyedi foglalási linkedet." },
                { icon: UserCheck, title: "Kezeld a Foglalásokat", description: "Kövesd nyomon és menedzseld foglalásaidat egyszerűen, bárhonnan, bármikor." }
              ].map((step, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg text-center">
                  <div className="flex justify-center mb-4">
                    <step.icon className="w-12 h-12 text-primary dark:text-primary-dark" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{step.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section - NEW */}
        <section id="testimonials" className="py-16 md:py-24 bg-white dark:bg-gray-900">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">Mit Mondanak Ügyfeleink?</h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">Büszkék vagyunk arra, hogy segíthetünk vállalkozásuk növekedésében.</p>
            </div>
            <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col">
                  <Star className="w-8 h-8 text-yellow-400 mb-4" /> {/* Decorative star */}
                  <p className="text-gray-600 dark:text-gray-400 italic mb-4 flex-grow">"{testimonial.quote}"</p>
                  <div className="flex items-center mt-auto">
                    {/* <testimonial.avatar className="w-10 h-10 rounded-full mr-3 text-gray-500" /> Placeholder for actual avatar image */}
                     <div className="w-10 h-10 rounded-full mr-3 bg-primary/20 dark:bg-primary-dark/20 flex items-center justify-center">
                        <UserCheck className="w-6 h-6 text-primary dark:text-primary-dark"/>
                     </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{testimonial.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section - NEW */}
        <section id="faq" className="py-16 md:py-24 bg-gray-50 dark:bg-gray-950">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">Gyakran Ismételt Kérdések</h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">Válaszok a leggyakoribb kérdésekre rendszerünkkel kapcsolatban.</p>
            </div>
            <div className="max-w-3xl mx-auto">
              <Accordion type="single" collapsible className="w-full">
                {faqItems.map((item) => (
                  <AccordionItem key={item.value} value={item.value} className="border-b dark:border-gray-700">
                    <AccordionTrigger className="text-left hover:no-underline py-4 text-base sm:text-lg font-medium text-gray-800 dark:text-gray-200">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="pt-1 pb-4 text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>

        {/* Call to Action Section - NEW */}
        <section className="py-16 md:py-24 bg-primary dark:bg-primary-dark text-white">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">Készen állsz, hogy egyszerűsítsd az időpontfoglalást?</h2>
            <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto">
              Csatlakozz a több száz elégedett vállalkozáshoz, akik már modernizálták működésüket velünk.
              Regisztrálj ingyenesen még ma!
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button size="xl" variant="secondary" className="w-full sm:w-auto bg-white text-primary dark:bg-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 shadow-lg">
                    Ingyenes Fiók Létrehozása
                </Button>
                <Button size="xl" variant="outline" className="w-full sm:w-auto border-white/50 text-white hover:bg-white/10">
                    Kapcsolatfelvétel <Phone className="ml-2 h-5 w-5" />
                </Button>
            </div>
          </div>
        </section>


        {/* Existing Onborda Demo Components - styled to fit better */}
        {/* These sections can be kept if they are relevant to your product, or removed if not. */}
        {/* For example, if Onborda is for a product tour, these demonstrate its capabilities. */}

      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-950">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <Logo />
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 max-w-xs">
                Egyszerűsítjük az időpontfoglalást, hogy te a vállalkozásodra koncentrálhass.
              </p>
              <div className="mt-4">
                <TrustpilotStars rating={4.9} reviewCount={125}/>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Hasznos Linkek</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="#features" className="text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-primary-dark">Funkciók</Link></li>
                <li><Link href="#pricing" className="text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-primary-dark">Árak</Link></li>
                <li><Link href="/blog" className="text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-primary-dark">Blog</Link></li>
                <li><Link href="/contact" className="text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-primary-dark">Kapcsolat</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Kapcsolat</h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center"><Mail className="w-4 h-4 mr-2 text-primary dark:text-primary-dark"/> info@szabadvok.hu</li>
                <li className="flex items-center"><Phone className="w-4 h-4 mr-2 text-primary dark:text-primary-dark"/> +36 (1) 123 4567</li>
                <li className="flex items-center"><MapPin className="w-4 h-4 mr-2 text-primary dark:text-primary-dark"/> Budapest, Fő utca 1, Magyarország</li>
              </ul>
            </div>
          </div>
          <div className="text-center text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-8">
            &copy; {new Date().getFullYear()} Szabadvok.hu. Minden jog fenntartva.
            <p className="mt-1">Fejlesztette: <Link href="#" className="hover:underline text-primary dark:text-primary-dark">Egy Kreatív Csapat</Link></p>
          </div>
        </div>
      </footer>
    </div>
  );
}
