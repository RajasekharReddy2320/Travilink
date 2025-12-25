import { useEffect, Suspense, lazy } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import FeaturedTrips from "@/components/FeaturedTrips";
import FloatingParticles from "@/components/FloatingParticles";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { Plane, Sparkles, Users, Globe, Camera, Ticket, Bot, Smartphone, ChevronDown } from "lucide-react";

const RealisticGlobe = lazy(() => import("@/components/RealisticGlobe"));

const AnimatedSection = ({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.2 });

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ease-out will-change-transform ${className}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translate3d(0,0,0)" : "translate3d(64px,0,0)",
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
};

const features = [
  {
    Icon: Users,
    emoji: "👥",
    title: "Social Travel Network",
    subtitle: "Connect & Explore Together",
    description: "Connect with fellow travelers, share experiences, and discover trips through our vibrant community. Find travel buddies who match your style and interests.",
    longDescription: "Join thousands of passionate travelers who share their stories, tips, and adventures. Our community-driven platform helps you find the perfect travel companions, get insider recommendations, and make lifelong connections.",
    gradient: "from-pink-500 via-rose-500 to-red-500",
    bgGradient: "from-pink-900/30 via-rose-900/20 to-red-900/30",
    accent: "pink",
  },
  {
    Icon: Globe,
    emoji: "🌍",
    title: "Find Travel Companions",
    subtitle: "Never Travel Alone",
    description: "Create or join travel groups for your upcoming trips. Connect with people traveling to the same destination and make your journey more memorable.",
    longDescription: "Whether you're a solo adventurer seeking company or a group looking for new members, our smart matching system connects you with compatible travelers. Share costs, experiences, and create memories together.",
    gradient: "from-blue-500 via-cyan-500 to-teal-500",
    bgGradient: "from-blue-900/30 via-cyan-900/20 to-teal-900/30",
    accent: "cyan",
  },
  {
    Icon: Camera,
    emoji: "📸",
    title: "Share Your Adventures",
    subtitle: "Inspire & Be Inspired",
    description: "Post photos, stories, and experiences from your travels. Like, comment, and save posts from fellow travelers to inspire your next adventure.",
    longDescription: "Turn your travel memories into inspiring stories. Our rich media platform lets you share photos, videos, and detailed trip experiences. Get featured, gain followers, and become a travel influencer.",
    gradient: "from-violet-500 via-purple-500 to-fuchsia-500",
    bgGradient: "from-violet-900/30 via-purple-900/20 to-fuchsia-900/30",
    accent: "purple",
  },
  {
    Icon: Ticket,
    emoji: "🎫",
    title: "Unified Booking",
    subtitle: "All Tickets, One Place",
    description: "Book flights, trains, and buses from multiple providers in one place. Get digital and QR code tickets for easy access.",
    longDescription: "Compare prices across hundreds of providers, book seamlessly, and manage all your tickets in one digital wallet. Our smart booking system finds you the best deals and keeps everything organized.",
    gradient: "from-amber-500 via-orange-500 to-red-500",
    bgGradient: "from-amber-900/30 via-orange-900/20 to-red-900/30",
    accent: "orange",
  },
  {
    Icon: Bot,
    emoji: "🤖",
    title: "AI Trip Planning",
    subtitle: "Smart Itineraries",
    description: "Get personalized itineraries tailored to your preferences with our AI-powered trip planner. Discover destinations, activities, and hidden gems.",
    longDescription: "Our advanced AI understands your travel style, budget, and interests to create perfect itineraries. From must-see attractions to hidden local gems, get recommendations that match your unique preferences.",
    gradient: "from-emerald-500 via-green-500 to-lime-500",
    bgGradient: "from-emerald-900/30 via-green-900/20 to-lime-900/30",
    accent: "emerald",
  },
  {
    Icon: Smartphone,
    emoji: "📱",
    title: "All-in-One Platform",
    subtitle: "Your Travel Companion",
    description: "Manage bookings, connect with travelers, and plan trips all in one intuitive dashboard. Access everything you need for your perfect journey.",
    longDescription: "From planning to booking to exploring, everything you need is in one place. Real-time updates, offline access, and seamless synchronization across all your devices make traveling effortless.",
    gradient: "from-indigo-500 via-blue-500 to-sky-500",
    bgGradient: "from-indigo-900/30 via-blue-900/20 to-sky-900/30",
    accent: "blue",
  }
];

const Welcome = () => {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      {/* Floating Particles Background */}
      <FloatingParticles />

      {/* Animated Background Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Header */}
      <header className="relative z-50 bg-background/60 backdrop-blur-xl border-b border-border/50 sticky top-0">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center max-w-6xl">
          <Link to="/welcome" className="flex items-center gap-2 group">
            <div className="p-2 bg-primary/10 backdrop-blur-sm rounded-xl border border-primary/20 group-hover:bg-primary/20 transition-all">
              <Plane className="h-6 w-6 text-primary transition-transform group-hover:rotate-12" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">
              Trave<span className="text-primary">X</span>a
            </h1>
          </Link>
          <div className="flex gap-3">
            <Button variant="ghost" size="sm" className="backdrop-blur-sm" asChild>
              <Link to="/login">Login</Link>
            </Button>
            <Button size="sm" className="shadow-lg shadow-primary/20" asChild>
              <Link to="/signup">Sign Up</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* Hero Section with Globe */}
        <section className="min-h-[90vh] flex items-center justify-center relative">
          <div className="container mx-auto px-6 py-16 max-w-6xl">
            <div className="flex flex-col lg:flex-row items-center gap-12">
              {/* Text Content */}
              <AnimatedSection className="flex-1 text-center lg:text-left">
                <Badge variant="secondary" className="mb-6 px-4 py-2 bg-background/60 backdrop-blur-xl border border-border/50 shadow-lg">
                  <Sparkles className="h-4 w-4 mr-2 text-accent" />
                  Welcome to Travexa
                </Badge>
                <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold mb-6 leading-tight">
                  Your{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 animate-gradient">
                    Social Travel
                  </span>
                  <br />Network
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground max-w-xl mb-8">
                  Connect with fellow travelers, share experiences, and find travel companions for your next adventure around the world.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Button size="lg" asChild className="px-10 py-6 text-lg shadow-2xl shadow-primary/30 hover:shadow-primary/50 transition-all hover:scale-105">
                    <Link to="/signup">
                      <Sparkles className="mr-2 h-5 w-5" />
                      Join the Community
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" onClick={scrollToFeatures} className="px-10 py-6 text-lg">
                    Explore Features
                    <ChevronDown className="ml-2 h-5 w-5 animate-bounce" />
                  </Button>
                </div>
              </AnimatedSection>

              {/* 3D Globe */}
              <AnimatedSection delay={300} className="flex-1 flex justify-center">
                <div className="relative w-[320px] h-[320px] md:w-[420px] md:h-[420px]">
                  {/* Globe Glow Effects */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500/40 via-blue-500/30 to-purple-500/40 blur-3xl animate-pulse" />
                  
                  {/* 3D Globe Container */}
                  <div className="relative w-full h-full rounded-full overflow-hidden">
                    <Suspense fallback={
                      <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 animate-pulse flex items-center justify-center">
                        <Globe className="h-20 w-20 text-white/50 animate-spin" style={{ animationDuration: '3s' }} />
                      </div>
                    }>
                      <RealisticGlobe />
                    </Suspense>
                  </div>

                  {/* Orbiting Planes */}
                  <div className="absolute inset-0 animate-spin" style={{ animationDuration: '20s' }}>
                    <Plane className="absolute -top-6 left-1/2 -translate-x-1/2 h-8 w-8 text-accent drop-shadow-lg" style={{ transform: 'rotate(45deg)' }} />
                  </div>
                  <div className="absolute inset-0 animate-spin" style={{ animationDuration: '15s', animationDirection: 'reverse' }}>
                    <Plane className="absolute -bottom-6 left-1/2 -translate-x-1/2 h-6 w-6 text-primary drop-shadow-lg" style={{ transform: 'rotate(-135deg)' }} />
                  </div>

                  {/* Travel the World Text */}
                  <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <p className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500">
                      ✈️ Travel the World ✈️
                    </p>
                  </div>
                </div>
              </AnimatedSection>
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
            <ChevronDown className="h-8 w-8 text-muted-foreground" />
          </div>
        </section>

        {/* Full Page Feature Sections */}
        <section id="features" className="relative snap-y snap-mandatory">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="min-h-screen flex items-center justify-center relative overflow-hidden snap-start"
            >
              {/* Background Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.bgGradient} opacity-50`} />

              {/* Glossy Overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-background/0 via-background/0 to-foreground/10" />

              {/* Content */}
              <div className="container mx-auto px-6 py-20 max-w-6xl relative z-10">
                <div
                  className={`flex flex-col ${idx % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"} items-center gap-12 lg:gap-20`}
                >
                  {/* Icon Side */}
                  <AnimatedSection delay={200} className="flex-1 flex justify-center">
                    <div className="relative">
                      {/* Glow Effect */}
                      <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} rounded-full blur-3xl opacity-30 scale-150`} />

                      {/* Icon Container */}
                      <div
                        className={`
                          relative w-48 h-48 md:w-64 md:h-64 rounded-full 
                          bg-gradient-to-br ${feature.gradient}
                          flex items-center justify-center
                          shadow-2xl
                        `}
                        style={{
                          animation: "float 6s ease-in-out infinite",
                          animationDelay: `${idx * 0.5}s`,
                        }}
                      >
                        {/* Glossy Finish */}
                        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-background/40 via-background/10 to-transparent" />
                        <div className="absolute inset-0 rounded-full bg-gradient-to-t from-foreground/15 to-transparent" />

                        {/* Icon */}
                        <feature.Icon
                          className="h-20 w-20 md:h-28 md:w-28 text-primary-foreground drop-shadow-2xl relative z-10"
                          strokeWidth={1.5}
                        />

                        {/* Emoji Badge */}
                        <div className="absolute -top-4 -right-4 text-5xl animate-bounce" style={{ animationDelay: `${idx * 0.2}s` }}>
                          {feature.emoji}
                        </div>
                      </div>
                    </div>
                  </AnimatedSection>

                  {/* Text Side */}
                  <AnimatedSection className="flex-1 text-center lg:text-left">
                    <Badge className={`mb-4 bg-gradient-to-r ${feature.gradient} text-primary-foreground border-0 text-sm px-4 py-1`}>
                      {feature.subtitle}
                    </Badge>
                    <h2
                      className={`text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r ${feature.gradient}`}
                    >
                      {feature.title}
                    </h2>
                    <p className="text-xl text-muted-foreground mb-6 leading-relaxed">{feature.description}</p>
                    <p className="text-lg text-muted-foreground/80 mb-8 leading-relaxed">{feature.longDescription}</p>
                    <Button
                      size="lg"
                      asChild
                      className={`px-8 py-6 text-lg bg-gradient-to-r ${feature.gradient} border-0 hover:opacity-90 transition-all hover:scale-105 shadow-xl`}
                    >
                      <Link to="/signup">
                        Get Started
                        <Sparkles className="ml-2 h-5 w-5" />
                      </Link>
                    </Button>
                  </AnimatedSection>
                </div>
              </div>

              {/* Decorative Elements */}
              <div
                className={`absolute top-20 ${idx % 2 === 0 ? "right-20" : "left-20"} w-32 h-32 bg-gradient-to-r ${feature.gradient} rounded-full blur-3xl opacity-20`}
              />
              <div
                className={`absolute bottom-20 ${idx % 2 === 0 ? "left-20" : "right-20"} w-48 h-48 bg-gradient-to-r ${feature.gradient} rounded-full blur-3xl opacity-15`}
              />
            </div>
          ))}
        </section>

        <FeaturedTrips />

        {/* Feedback Section */}
        <AnimatedSection className="container mx-auto px-6 py-20 max-w-4xl">
          <Card className="relative overflow-hidden border-2 border-accent/20 bg-gradient-to-br from-accent/5 via-background to-primary/5 backdrop-blur-xl shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            
            <CardHeader className="text-center relative z-10">
              <Badge className="w-fit mx-auto mb-4 bg-accent/20 text-accent border-accent/30">
                <Sparkles className="h-3 w-3 mr-1" />
                Feedback
              </Badge>
              <CardTitle className="text-3xl md:text-4xl mb-4">We'd Love Your Feedback!</CardTitle>
              <CardDescription className="text-base">
                Travexa is currently in development. We're building a fully functional travel planning and booking platform with social networking features.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-6 relative z-10">
              <p className="text-xl font-medium text-foreground">
                Would you use Travexa if it were fully functional?
              </p>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Your feedback helps us understand what travelers need most. We're working hard to bring you features like social connections with fellow travelers, travel companion matching, and seamless booking experiences.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button size="lg" className="px-8 shadow-xl shadow-primary/20 hover:shadow-primary/40" asChild>
                  <Link to="/signup">Yes, Sign Me Up!</Link>
                </Button>
                <Button size="lg" variant="outline" className="px-8 bg-background/50 backdrop-blur-sm" asChild>
                  <Link to="/signup">Maybe, Tell Me More</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </AnimatedSection>
      </main>

      <footer className="relative z-10 border-t border-border/50 bg-background/60 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-8 max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <div className="text-center md:text-left">
              <p>© {new Date().getFullYear()} Travexa. All rights reserved.</p>
              <p className="text-xs mt-1">Made with ❤️ by Pranay with Rajasekhar</p>
            </div>
            <div className="flex gap-6">
              <Link to="/login" className="hover:text-foreground transition-colors">Login</Link>
              <Link to="/signup" className="hover:text-foreground transition-colors">Sign Up</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Float Animation Keyframes */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(5deg);
          }
        }
        
        @keyframes gradient {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 4s ease infinite;
        }
      `}</style>
    </div>
  );
};

export default Welcome;
