import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CartItem } from '@/types/tripPlanner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ShoppingCart, Trash2, IndianRupee } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

interface PlannerCartProps {
  items: CartItem[];
  onRemove: (id: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  currentLocation?: string;
}

const PlannerCart: React.FC<PlannerCartProps> = ({ items, onRemove, isOpen, setIsOpen, currentLocation = '' }) => {
  const navigate = useNavigate();
  const { addToCart: addToGlobalCart } = useCart();
  const totalCost = items.reduce((sum, item) => sum + (item.estimatedCost || 0), 0);

  const handleProceedToCheckout = () => {
    // Add all planner cart items to global cart
    items.forEach(item => {
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
    setIsOpen(false);
    navigate('/cart');
  };

  return (
    <>
      {/* Floating Cart Button */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            className="fixed bottom-6 right-6 z-50 rounded-full h-14 w-14 shadow-lg"
            size="icon"
          >
            <ShoppingCart size={24} />
            {items.length > 0 && (
              <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center">
                {items.length}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <ShoppingCart size={20} />
              Your Trip Cart
              <Badge variant="secondary">{items.length} items</Badge>
            </SheetTitle>
          </SheetHeader>

          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground">
              <ShoppingCart size={48} className="mb-4 opacity-50" />
              <p className="font-medium">Your cart is empty</p>
              <p className="text-sm">Add bookable items from your itinerary</p>
            </div>
          ) : (
            <>
              <ScrollArea className="h-[calc(100vh-200px)] mt-6">
                <div className="space-y-4 pr-4">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="bg-muted rounded-xl p-4 flex items-start gap-3"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs capitalize">
                            {item.category}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Day {item.day}
                          </span>
                        </div>
                        <h4 className="font-semibold text-sm">{item.title}</h4>
                        <p className="text-xs text-muted-foreground">{item.location}</p>
                        {item.estimatedCost && (
                          <p className="text-sm font-medium mt-1 flex items-center gap-1">
                            <IndianRupee size={12} />
                            {item.estimatedCost.toLocaleString()}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => onRemove(item.id)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Total & Checkout */}
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-background border-t">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-muted-foreground">Estimated Total</span>
                  <span className="text-xl font-bold flex items-center gap-1">
                    <IndianRupee size={18} />
                    {totalCost.toLocaleString()}
                  </span>
                </div>
                <Button className="w-full" size="lg" onClick={handleProceedToCheckout}>
                  Proceed to Checkout
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};

export default PlannerCart;
