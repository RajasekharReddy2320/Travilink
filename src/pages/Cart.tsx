import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import DashboardNav from "@/components/DashboardNav";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Trash2, ShoppingCart, Plane, Train, Bus } from "lucide-react";

const Cart = () => {
  const navigate = useNavigate();
  const { items, removeFromCart, clearCart, totalPrice, itemCount } = useCart();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const getIcon = (type: string) => {
    switch (type) {
      case "flight":
        return <Plane className="h-5 w-5" />;
      case "train":
        return <Train className="h-5 w-5" />;
      case "bus":
        return <Bus className="h-5 w-5" />;
      default:
        return <ShoppingCart className="h-5 w-5" />;
    }
  };

  const handleCheckout = async () => {
    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/login");
        return;
      }

      // Create trip group ID for multi-segment booking
      const tripGroupId = crypto.randomUUID();
      
      // Generate booking reference for the entire trip
      const bookingReference = `TRV${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
      
      // Sort items by departure date/time
      const sortedItems = [...items].sort((a, b) => {
        const dateA = new Date(`${a.departure_date}T${a.departure_time}`);
        const dateB = new Date(`${b.departure_date}T${b.departure_time}`);
        return dateA.getTime() - dateB.getTime();
      });

      // Create all segments
      const segmentPromises = sortedItems.map(async (item, index) => {
        const { error } = await supabase
          .from('trip_segments')
          .insert({
            trip_group_id: tripGroupId,
            user_id: user.id,
            segment_order: index + 1,
            booking_type: item.booking_type,
            service_name: item.service_name,
            service_number: item.service_number,
            from_location: item.from_location,
            to_location: item.to_location,
            departure_date: item.departure_date,
            departure_time: item.departure_time,
            arrival_time: item.arrival_time,
            passenger_name: item.passenger_name,
            passenger_email: item.passenger_email,
            passenger_phone: item.passenger_phone,
            seat_number: item.seat_number,
            class_type: item.class_type,
            price_inr: item.price_inr,
            payment_status: 'completed',
            status: 'confirmed',
          });

        if (error) throw error;
      });

      await Promise.all(segmentPromises);

      // Create main booking record for the trip
      const qrData = {
        ref: bookingReference,
        tripGroupId,
        segments: sortedItems.length,
        passenger: sortedItems[0].passenger_name,
      };
      const qrCode = btoa(JSON.stringify(qrData));

      const { error: bookingError } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          trip_group_id: tripGroupId,
          booking_reference: bookingReference,
          booking_type: 'multi-segment',
          passenger_name: sortedItems[0].passenger_name,
          passenger_email: sortedItems[0].passenger_email,
          passenger_phone: sortedItems[0].passenger_phone,
          from_location: sortedItems[0].from_location,
          to_location: sortedItems[sortedItems.length - 1].to_location,
          departure_date: sortedItems[0].departure_date,
          departure_time: sortedItems[0].departure_time,
          arrival_time: sortedItems[sortedItems.length - 1].arrival_time,
          service_name: `Multi-Segment Trip (${sortedItems.length} legs)`,
          service_number: bookingReference,
          price_inr: totalPrice,
          payment_status: 'completed',
          status: 'confirmed',
          qr_code: qrCode,
        });

      if (bookingError) throw bookingError;

      toast({
        title: "Multi-Segment Trip Booked!",
        description: `${itemCount} connecting tickets booked successfully for ₹${totalPrice.toLocaleString("en-IN")}`,
      });

      clearCart();
      navigate("/my-tickets");
    } catch (error) {
      console.error("Error processing cart:", error);
      toast({
        title: "Booking Failed",
        description: "There was an error processing your bookings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (itemCount === 0) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardNav />
        <div className="container py-8">
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <ShoppingCart className="h-24 w-24 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">Add tickets to your cart to book multiple trips at once</p>
            <Button onClick={() => navigate("/book-transport")}>
              Browse Tickets
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <div className="container py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">Your Cart</h1>
              <p className="text-muted-foreground">{itemCount} item(s) in cart</p>
            </div>
            <Button variant="outline" onClick={clearCart}>
              Clear All
            </Button>
          </div>

          <div className="space-y-4">
            {items.map((item) => (
              <Card key={item.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        {getIcon(item.booking_type)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{item.service_name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{item.service_number}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">From</p>
                      <p className="font-medium">{item.from_location}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">To</p>
                      <p className="font-medium">{item.to_location}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Date</p>
                      <p className="font-medium">{item.departure_date}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Time</p>
                      <p className="font-medium">{item.departure_time}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Passenger</p>
                      <p className="font-medium">{item.passenger_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-muted-foreground">Price</p>
                      <p className="text-lg font-bold text-primary">
                        ₹{item.price_inr.toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal ({itemCount} items)</span>
                <span>₹{totalPrice.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Platform Fee</span>
                <span>₹0</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>₹{totalPrice.toLocaleString("en-IN")}</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                size="lg"
                onClick={handleCheckout}
                disabled={isProcessing}
              >
                {isProcessing ? "Processing..." : `Proceed to Checkout - ₹${totalPrice.toLocaleString("en-IN")}`}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Cart;
