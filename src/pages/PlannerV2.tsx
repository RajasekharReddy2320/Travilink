import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import InputForm from "@/components/planner/InputForm";
import ItineraryCard from "@/components/planner/ItineraryCard";
import ItineraryMap from "@/components/planner/ItineraryMap";
import PlannerCart from "@/components/planner/PlannerCart";
import { TripParams, TripResponse, ItineraryStep, CartItem } from "@/types/tripPlanner";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, Sparkles, PlusCircle, Plane, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/contexts/CartContext';
const PlannerV2 = () => {
  const navigate = useNavigate();
  const { addToCart: addToGlobalCart } = useCart();
  const [tripData, setTripData] = useState<TripResponse | null>(null);
  const [tripDestination, setTripDestination] = useState<string>('');
  const [currentLocation, setCurrentLocation] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { toast } = useToast();

  const handleProceedToCheckout = () => {
    // Add all planner cart items to global cart
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

  const handlePlanTrip = async (params: TripParams) => {
    setIsLoading(true);
    setError(null);
    setTripData(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-trip-plan', {
        body: params
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setTripData(data);
      setTripDestination(params.destination);
      setCurrentLocation(params.currentLocation);
      toast({
        title: "Trip Generated!",
        description: `Your ${params.destination} itinerary is ready.`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to generate trip plan";
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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

  const handleAddAll = () => {
    if (!tripData) return;
    // Add all items that have an estimated cost
    const newItems = tripData.steps
      .filter(step => step.estimatedCost && step.estimatedCost > 0 && !cartItems.some(item => item.id === step.id))
      .map(step => ({ ...step, addedAt: Date.now() }));
    if (newItems.length > 0) {
      setCartItems(prev => [...prev, ...newItems]);
      setIsCartOpen(true);
      toast({
        title: "Added All Paid Items",
        description: `${newItems.length} items added to cart`,
      });
    }
  };

  const handleRemoveFromCart = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft size={20} />
            </Button>
            <div className="flex items-center gap-2">
              <Plane className="text-primary" size={24} />
              <h1 className="text-xl font-bold">Trip Planner</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="pb-20">
        <div className="max-w-5xl mx-auto px-6 py-10">
          {/* Intro Text */}
          {!tripData && !isLoading && (
            <div className="text-center mb-10 space-y-4 max-w-2xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight">
                Where do you want to{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
                  go?
                </span>
              </h2>
              <p className="text-lg text-muted-foreground">
                Enter your details below and let our AI curate a perfect, bookable itinerary just for you.
              </p>
            </div>
          )}

          {/* Input Form */}
          <InputForm onSubmit={handlePlanTrip} isLoading={isLoading} />

          {/* Error State */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-2xl flex items-center gap-3 max-w-2xl mx-auto mb-8 animate-fade-in">
              <AlertCircle size={24} />
              <p>{error}</p>
            </div>
          )}

          {/* Results Area */}
          {tripData && (
            <div className="animate-fade-in">
              {/* Trip Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-1.5 rounded-full text-sm font-bold mb-4">
                  <Sparkles size={14} />
                  {tripData.reason}
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                  {tripData.title}
                </h2>
                <p className="text-muted-foreground mb-6">Here is your curated itinerary</p>
                
                {/* Add All Button */}
                <Button
                  onClick={handleAddAll}
                  variant="secondary"
                  className="inline-flex items-center gap-2"
                >
                  <PlusCircle size={16} />
                  Add All Paid Items to Cart
                </Button>
              </div>

              {/* Interactive Map with all stops */}
              <ItineraryMap steps={tripData.steps} />

              {/* Timeline Connector Line (Visual) */}
              <div className="relative">
                <div className="absolute left-[50%] top-0 bottom-0 w-px bg-border hidden md:block -z-10 transform -translate-x-1/2"></div>
                
                {/* Steps */}
                <div className="space-y-6 relative z-10">
                  {tripData.steps.map((step) => (
                    <ItineraryCard
                      key={step.id}
                      step={step}
                      onAdd={handleAddToCart}
                      isAdded={cartItems.some(item => item.id === step.id)}
                    />
                  ))}
                </div>
              </div>

              {/* Completion Message */}
              <div className="text-center mt-16 pb-10">
                <p className="text-muted-foreground text-sm">End of Itinerary</p>
                <div className="w-2 h-2 bg-muted-foreground/50 rounded-full mx-auto mt-2"></div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Cart Component */}
      <PlannerCart
        items={cartItems}
        onRemove={handleRemoveFromCart}
        isOpen={isCartOpen}
        setIsOpen={setIsCartOpen}
        currentLocation={currentLocation}
      />
    </div>
  );
};

export default PlannerV2;
