import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, IndianRupee, MapPin, Sparkles, Users, Zap, Clock, Wallet, Check, ArrowRight, Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import DashboardNav from "@/components/DashboardNav";
import ItineraryCard from "@/components/planner/ItineraryCard";
import ItineraryMap from "@/components/planner/ItineraryMap";
import PlannerCart from "@/components/planner/PlannerCart";
import { ItineraryStep, CartItem } from "@/types/tripPlanner";
import { useCart } from "@/contexts/CartContext";

const INTEREST_OPTIONS = [
  "Adventure", "Culture", "Food", "Nature", "History", 
  "Beach", "Shopping", "Nightlife", "Museums", "Photography"
];

type PlannerMode = 'comfort' | 'time' | 'budget';

const PLANNER_MODES = [
  {
    value: 'comfort' as PlannerMode,
    icon: Sparkles,
    title: 'Comfort',
    description: 'Premium experiences & relaxation',
    color: 'text-purple-500'
  },
  {
    value: 'time' as PlannerMode,
    icon: Clock,
    title: 'Time Saver',
    description: 'Efficient routing & max activities',
    color: 'text-blue-500'
  },
  {
    value: 'budget' as PlannerMode,
    icon: Wallet,
    title: 'Budget',
    description: 'Cost-effective & value deals',
    color: 'text-green-500'
  }
];

interface GeneratedItinerary {
  id: string;
  title: string;
  subtitle: string;
  reason: string;
  estimatedTotalCost: number;
  steps: ItineraryStep[];
}

export default function PlanTrip() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addToCart: addToGlobalCart } = useCart();
  
  const [loading, setLoading] = useState(false);
  const [plannerMode, setPlannerMode] = useState<PlannerMode>('comfort');
  const [currentLocation, setCurrentLocation] = useState("");
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [budgetINR, setBudgetINR] = useState("");
  const [groupSize, setGroupSize] = useState("2");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  
  const [itineraries, setItineraries] = useState<GeneratedItinerary[]>([]);
  const [selectedItinerary, setSelectedItinerary] = useState<GeneratedItinerary | null>(null);
  
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleGenerate = async () => {
    if (!destination || !startDate || !endDate || selectedInterests.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please fill destination, dates, and select at least one interest.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setItineraries([]);
    setSelectedItinerary(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-itinerary', {
        body: {
          currentLocation: currentLocation || undefined,
          destination,
          startDate,
          endDate,
          budgetINR: budgetINR ? parseFloat(budgetINR) : null,
          groupSize: parseInt(groupSize),
          interests: selectedInterests,
          plannerMode,
          generateMultiple: true
        }
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.itineraries && data.itineraries.length > 0) {
        // Navigate to the Generated Itineraries page
        navigate('/generated-itineraries', {
          state: {
            itineraries: data.itineraries,
            currentLocation,
            destination
          }
        });
      } else {
        throw new Error("No itineraries generated");
      }
    } catch (error: any) {
      console.error('Error generating itinerary:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate itineraries. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectItinerary = (itinerary: GeneratedItinerary) => {
    setSelectedItinerary(itinerary);
    setCartItems([]);
    toast({
      title: `Selected: ${itinerary.title}`,
      description: "Scroll down to view your detailed itinerary.",
    });
  };

  const handleAddToCart = (step: ItineraryStep) => {
    if (!cartItems.some(item => item.id === step.id)) {
      setCartItems(prev => [...prev, { ...step, addedAt: Date.now() }]);
      setIsCartOpen(true);
      toast({
        title: "Added to Cart",
        description: step.title,
      });
    }
  };

  const handleRemoveFromCart = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const handleProceedToCheckout = () => {
    cartItems.forEach(item => {
      addToGlobalCart({
        id: item.id,
        booking_type: item.category === 'transport' ? 'flight' : 'bus',
        service_name: item.title,
        service_number: `PLN-${item.id.slice(0, 6).toUpperCase()}`,
        from_location: currentLocation || 'Origin',
        to_location: item.location,
        departure_date: new Date().toISOString().split('T')[0],
        departure_time: item.time,
        arrival_time: item.time,
        duration: item.duration || '1h',
        price_inr: item.estimatedCost || 0,
        passenger_name: '',
        passenger_email: '',
        passenger_phone: '',
      });
    });
    navigate('/cart');
  };

  const handleSaveTrip = async () => {
    if (!selectedItinerary) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/login");
      return;
    }

    const { error } = await supabase
      .from("trips")
      .insert([{
        user_id: user.id,
        title: `${destination} - ${selectedItinerary.title}`,
        destination,
        start_date: startDate,
        end_date: endDate,
        trip_type: 'ai',
        planner_mode: plannerMode,
        budget_inr: budgetINR ? parseFloat(budgetINR) : null,
        group_size: parseInt(groupSize),
        interests: selectedInterests,
        itinerary: selectedItinerary as any
      }]);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save trip",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Trip Saved!",
      description: "Your trip has been saved to your profile."
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      
      <main className="container mx-auto px-4 py-8 pb-32">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              <Sparkles size={14} />
              AI-Powered Planning
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-3 tracking-tight">
              Plan Your{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
                Dream Trip
              </span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Get 4 unique AI-curated itineraries tailored to your style. Pick your favorite and start booking!
            </p>
          </div>

          {/* Planner Mode Selection */}
          <div className="mb-8">
            <Label className="text-sm font-semibold mb-3 block text-center">Planning Style</Label>
            <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto">
              {PLANNER_MODES.map((mode) => {
                const Icon = mode.icon;
                const isActive = plannerMode === mode.value;
                
                return (
                  <button
                    key={mode.value}
                    type="button"
                    className={`p-4 rounded-xl border-2 transition-all text-center ${
                      isActive 
                        ? 'border-primary bg-primary/5 shadow-md' 
                        : 'border-border hover:border-primary/50 bg-card'
                    }`}
                    onClick={() => setPlannerMode(mode.value)}
                  >
                    <Icon className={`h-6 w-6 mx-auto mb-2 ${isActive ? mode.color : 'text-muted-foreground'}`} />
                    <p className="font-semibold text-sm">{mode.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 hidden sm:block">{mode.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Input Form */}
          <Card className="mb-8 shadow-lg border-2">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Plane className="text-primary" size={20} />
                Trip Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Locations */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="currentLocation" className="flex items-center gap-2 mb-2">
                    <MapPin size={14} className="text-primary" />
                    Departure City (Optional)
                  </Label>
                  <Input
                    id="currentLocation"
                    placeholder="e.g., Mumbai, India"
                    value={currentLocation}
                    onChange={(e) => setCurrentLocation(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="destination" className="flex items-center gap-2 mb-2">
                    <MapPin size={14} className="text-destructive" />
                    Destination *
                  </Label>
                  <Input
                    id="destination"
                    placeholder="e.g., Goa, India"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate" className="flex items-center gap-2 mb-2">
                    <Calendar size={14} className="text-primary" />
                    Start Date *
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="endDate" className="flex items-center gap-2 mb-2">
                    <Calendar size={14} className="text-primary" />
                    End Date *
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Budget & Group */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="budgetINR" className="flex items-center gap-2 mb-2">
                    <IndianRupee size={14} className="text-primary" />
                    Budget (INR)
                  </Label>
                  <Input
                    id="budgetINR"
                    type="number"
                    placeholder="50000"
                    value={budgetINR}
                    onChange={(e) => setBudgetINR(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="groupSize" className="flex items-center gap-2 mb-2">
                    <Users size={14} className="text-primary" />
                    Travelers
                  </Label>
                  <Input
                    id="groupSize"
                    type="number"
                    min="1"
                    value={groupSize}
                    onChange={(e) => setGroupSize(e.target.value)}
                  />
                </div>
              </div>

              {/* Interests */}
              <div>
                <Label className="mb-3 block">Interests *</Label>
                <div className="flex flex-wrap gap-2">
                  {INTEREST_OPTIONS.map((interest) => (
                    <Badge
                      key={interest}
                      variant={selectedInterests.includes(interest) ? "default" : "outline"}
                      className="cursor-pointer transition-all hover:scale-105 py-1.5 px-3"
                      onClick={() => toggleInterest(interest)}
                    >
                      {selectedInterests.includes(interest) && <Check size={12} className="mr-1" />}
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full py-6 text-lg font-bold"
                size="lg"
              >
                {loading ? (
                  <>
                    <Zap className="mr-2 h-5 w-5 animate-spin" />
                    Generating 4 Itineraries...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Generate 4 Itinerary Options
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Itinerary Selection Cards */}
          {itineraries.length > 0 && !selectedItinerary && (
            <div className="animate-fade-in">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-2">Choose Your Adventure</h2>
                <p className="text-muted-foreground">We've created {itineraries.length} unique itineraries for you. Pick your favorite!</p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                {itineraries.map((itinerary, index) => (
                  <Card 
                    key={itinerary.id || index}
                    className={`cursor-pointer transition-all hover:shadow-xl hover:border-primary/50 border-2 group`}
                    onClick={() => handleSelectItinerary(itinerary)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <Badge variant="secondary" className="mb-2 text-xs">Option {index + 1}</Badge>
                          <CardTitle className="text-lg group-hover:text-primary transition-colors">
                            {itinerary.title}
                          </CardTitle>
                          <CardDescription className="mt-1">{itinerary.subtitle}</CardDescription>
                        </div>
                        <ArrowRight className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" size={20} />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">{itinerary.reason}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{itinerary.steps?.length || 0} activities</span>
                        <span className="font-bold text-primary">
                          ₹{(itinerary.estimatedTotalCost || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Selected Itinerary Detail View */}
          {selectedItinerary && (
            <div className="animate-fade-in">
              {/* Header */}
              <div className="text-center mb-8">
                <Button 
                  variant="ghost" 
                  className="mb-4"
                  onClick={() => setSelectedItinerary(null)}
                >
                  ← Back to all options
                </Button>
                <div className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-1.5 rounded-full text-sm font-bold mb-4">
                  <Sparkles size={14} />
                  {selectedItinerary.subtitle}
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                  {selectedItinerary.title}
                </h2>
                <p className="text-muted-foreground mb-4">{selectedItinerary.reason}</p>
                <div className="flex items-center justify-center gap-4 flex-wrap">
                  <Badge variant="outline" className="text-lg py-1 px-4">
                    Est. ₹{(selectedItinerary.estimatedTotalCost || 0).toLocaleString('en-IN')}
                  </Badge>
                  <Button onClick={handleSaveTrip} variant="secondary">
                    Save Trip
                  </Button>
                </div>
              </div>

              {/* Map */}
              {selectedItinerary.steps && selectedItinerary.steps.length > 0 && (
                <ItineraryMap steps={selectedItinerary.steps} />
              )}

              {/* Timeline */}
              <div className="relative">
                <div className="absolute left-[50%] top-0 bottom-0 w-px bg-border hidden md:block -z-10 transform -translate-x-1/2"></div>
                
                <div className="space-y-6">
                  {selectedItinerary.steps?.map((step) => (
                    <ItineraryCard
                      key={step.id}
                      step={step}
                      onAdd={handleAddToCart}
                      isAdded={cartItems.some(item => item.id === step.id)}
                    />
                  ))}
                </div>
              </div>

              {/* End marker */}
              <div className="text-center mt-16 pb-10">
                <p className="text-muted-foreground text-sm">End of Itinerary</p>
                <div className="w-2 h-2 bg-muted-foreground/50 rounded-full mx-auto mt-2"></div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Cart */}
      <PlannerCart
        items={cartItems}
        onRemove={handleRemoveFromCart}
        isOpen={isCartOpen}
        setIsOpen={setIsCartOpen}
        currentLocation={currentLocation}
      />
    </div>
  );
}
