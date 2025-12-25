import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Plane, Train, Bus, Calendar, MapPin, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface GroupTripPlannerProps {
  groupId: string;
  groupTitle: string;
  fromLocation: string;
  toLocation: string;
  travelDate: string;
  travelMode: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const GroupTripPlanner = ({
  groupTitle,
  fromLocation,
  toLocation,
  travelDate,
  travelMode,
  open,
  onOpenChange,
}: GroupTripPlannerProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [passengers, setPassengers] = useState("1");

  const handleBookNow = () => {
    // Navigate to booking page with pre-filled data
    const bookingData = {
      from: fromLocation,
      to: toLocation,
      date: travelDate,
      passengers: parseInt(passengers),
      type: travelMode,
    };
    
    navigate("/book", { state: bookingData });
    onOpenChange(false);
    
    toast({
      title: "Redirecting to booking",
      description: "Pre-filling your group trip details...",
    });
  };

  const getModeIcon = () => {
    switch (travelMode) {
      case "flight":
        return <Plane className="h-5 w-5" />;
      case "train":
        return <Train className="h-5 w-5" />;
      case "bus":
        return <Bus className="h-5 w-5" />;
      default:
        return <MapPin className="h-5 w-5" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getModeIcon()}
            Plan & Book Trip
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{groupTitle}</CardTitle>
              <CardDescription>Group trip details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Route:</span>
                <span>{fromLocation} → {toLocation}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Date:</span>
                <span>{new Date(travelDate).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                {getModeIcon()}
                <span className="font-medium">Mode:</span>
                <span className="capitalize">{travelMode}</span>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <Label htmlFor="passengers">Number of Passengers</Label>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <Input
                id="passengers"
                type="number"
                min="1"
                value={passengers}
                onChange={(e) => setPassengers(e.target.value)}
                placeholder="1"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              How many people from your group will be traveling?
            </p>
          </div>

          <div className="pt-4 space-y-2">
            <Button onClick={handleBookNow} className="w-full" size="lg">
              Search & Book {travelMode === "flight" ? "Flights" : travelMode === "train" ? "Trains" : "Buses"}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              You'll be redirected to the booking page with pre-filled details
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};