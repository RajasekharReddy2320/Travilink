import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Calendar, IndianRupee, Users, UserCog } from "lucide-react";
import DashboardNav from "@/components/DashboardNav";

const CreateTrip = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tripData, setTripData] = useState({
    title: "",
    destination: "",
    start_date: "",
    end_date: "",
    budget_range: "",
    group_size: "1",
    notes: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tripData.title || !tripData.destination || !tripData.start_date || !tripData.end_date) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    // Store trip preferences for agents to reference
    localStorage.setItem('tripPreferences', JSON.stringify(tripData));

    toast({
      title: "Preferences Saved",
      description: "Now connect with an agent or guide to plan your trip"
    });

    // Navigate to agents page
    navigate("/travel-agents");
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />

      <main className="container px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Create New Trip</h1>
          <p className="text-muted-foreground">Plan your trip manually with full control</p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Trip Details</CardTitle>
              <CardDescription>Fill in your trip information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="title">Trip Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Summer Vacation to Goa"
                  value={tripData.title}
                  onChange={(e) => setTripData({ ...tripData, title: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="destination">Destination *</Label>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="destination"
                    placeholder="e.g., Goa, India"
                    value={tripData.destination}
                    onChange={(e) => setTripData({ ...tripData, destination: e.target.value })}
                    required
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Start Date *</Label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="start_date"
                      type="date"
                      value={tripData.start_date}
                      onChange={(e) => setTripData({ ...tripData, start_date: e.target.value })}
                      required
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="end_date">End Date *</Label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="end_date"
                      type="date"
                      value={tripData.end_date}
                      onChange={(e) => setTripData({ ...tripData, end_date: e.target.value })}
                      required
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="budget_range">Budget Range</Label>
                  <div className="flex items-center gap-2">
                    <IndianRupee className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="budget_range"
                      placeholder="e.g., ₹50,000 - ₹1,00,000"
                      value={tripData.budget_range}
                      onChange={(e) => setTripData({ ...tripData, budget_range: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="group_size">Group Size</Label>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="group_size"
                      type="number"
                      min="1"
                      value={tripData.group_size}
                      onChange={(e) => setTripData({ ...tripData, group_size: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Preferences</Label>
                <Textarea
                  id="notes"
                  placeholder="Add your travel preferences..."
                  value={tripData.notes}
                  onChange={(e) => setTripData({ ...tripData, notes: e.target.value })}
                  rows={6}
                />
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Button type="submit" className="w-full">
                    <UserCog className="mr-2 h-4 w-4" />
                    Find Travel Agents
                  </Button>
                  <Button 
                    type="button" 
                    onClick={() => {
                      localStorage.setItem('tripPreferences', JSON.stringify(tripData));
                      navigate("/local-guides");
                    }}
                    className="w-full"
                  >
                    <MapPin className="mr-2 h-4 w-4" />
                    Find Local Guides
                  </Button>
                </div>
                <Button type="button" variant="outline" onClick={() => navigate("/plan-trip")} className="w-full">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>

      </main>
    </div>
  );
};

export default CreateTrip;