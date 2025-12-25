import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import FeaturedTrips from "@/components/FeaturedTrips";
import { Plane } from "lucide-react";

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

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card/50 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center max-w-6xl">
          <Link to="/welcome" className="flex items-center gap-2 group">
            <Plane className="h-6 w-6 text-primary transition-transform group-hover:rotate-12" />
            <h1 className="text-xl font-bold tracking-tight">
              Trave<span className="text-primary">X</span>a
            </h1>
          </Link>
          <div className="flex gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/login">Login</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/signup">Sign Up</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="container mx-auto px-6 py-16 md:py-24 max-w-4xl text-center">
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl"></div>
              <div className="relative">
                <Plane className="h-24 w-24 text-primary" />
              </div>
            </div>
          </div>

          <div className="mb-6">
            <Badge variant="secondary" className="mb-4">
              Welcome to Travexa
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Your <span className="text-primary">Social Travel</span> Network
            </h1>
          </div>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Connect with fellow travelers, share experiences, and find travel companions for your next adventure.
          </p>

          <Button size="lg" asChild className="px-8">
            <Link to="/signup">Join the Community</Link>
          </Button>
        </section>

        <section className="container mx-auto px-6 py-16 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose Travexa?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Your all-in-one travel companion that revolutionizes how you plan, book, and experience your journeys
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                emoji: "👥",
                title: "Social Travel Network",
                description: "Connect with fellow travelers, share experiences, and discover trips through our vibrant community. Find travel buddies and get inspired by real travelers' stories."
              },
              {
                emoji: "🌍",
                title: "Find Travel Companions",
                description: "Create or join travel groups for your upcoming trips. Connect with people traveling to the same destination and make your journey more memorable."
              },
              {
                emoji: "📸",
                title: "Share Your Adventures",
                description: "Post photos, stories, and experiences from your travels. Like, comment, and save posts from fellow travelers to inspire your next adventure."
              },
              {
                emoji: "🎫",
                title: "Unified Booking",
                description: "Book flights, trains, and buses from multiple providers in one place. Get digital and QR code tickets for easy access."
              },
              {
                emoji: "🤖",
                title: "AI Trip Planning",
                description: "Get personalized itineraries tailored to your preferences with our AI-powered trip planner. Discover destinations, activities, and hidden gems."
              },
              {
                emoji: "📱",
                title: "All-in-One Platform",
                description: "Manage bookings, connect with travelers, and plan trips all in one intuitive dashboard. Access everything you need for your perfect journey."
              }
            ].map((feature, idx) => (
              <div key={idx} className="group relative overflow-hidden transition-all duration-300 hover:scale-105">
                <div className="p-6 backdrop-blur-sm bg-card/50 rounded-lg border border-border/50 hover:border-primary/50 transition-all duration-300">
                  <div className="text-4xl mb-4 transition-transform duration-300 group-hover:scale-110">
                    {feature.emoji}
                  </div>
                  <h3 className="text-xl font-semibold mb-3 transition-all duration-300 group-hover:text-primary">
                    <span className="inline-block transition-all duration-300 group-hover:scale-110">
                      {feature.title}
                    </span>
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <FeaturedTrips />

        <section className="container mx-auto px-6 py-20 max-w-4xl">
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl mb-4">We'd Love Your Feedback!</CardTitle>
              <CardDescription className="text-base">
                Travexa is currently in development. We're building a fully functional travel planning and booking platform with social networking features.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-lg font-medium text-foreground">
                Would you use Travexa if it were fully functional?
              </p>
              <p className="text-muted-foreground">
                Your feedback helps us understand what travelers need most. We're working hard to bring you features like social connections with fellow travelers, travel companion matching, and seamless booking experiences.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button size="lg" className="px-8" asChild>
                  <Link to="/signup">Yes, Sign Me Up!</Link>
                </Button>
                <Button size="lg" variant="outline" className="px-8" asChild>
                  <Link to="/signup">Maybe, Tell Me More</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      <footer className="border-t border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-8 max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <div className="text-center md:text-left">
              <p>© {new Date().getFullYear()} Travexa. All rights reserved.</p>
              <p className="text-xs mt-1">Made with ❤️ by Rajasekhar</p>
            </div>
            <div className="flex gap-6">
              <Link to="/login" className="hover:text-foreground transition-colors">Login</Link>
              <Link to="/signup" className="hover:text-foreground transition-colors">Sign Up</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Welcome;