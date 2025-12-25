import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardNav from "@/components/DashboardNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plane, Train, Bus, Hotel, Car, Search, MapPin, Calendar, Users, ArrowRight, Clock } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const searchSchema = z.object({
  from: z.string().trim().min(2, "Origin must be at least 2 characters").max(100),
  to: z.string().trim().min(2, "Destination must be at least 2 characters").max(100),
  date: z.string().refine((d) => !isNaN(Date.parse(d)), "Invalid date"),
  passengers: z.number().int().min(1).max(9)
});

type BookingSection = 'flights' | 'trains' | 'buses' | 'hotels' | 'cabs';

const SECTIONS: { id: BookingSection; label: string; icon: typeof Plane }[] = [
  { id: 'flights', label: 'Flights', icon: Plane },
  { id: 'trains', label: 'Trains', icon: Train },
  { id: 'buses', label: 'Buses', icon: Bus },
  { id: 'hotels', label: 'Hotels', icon: Hotel },
  { id: 'cabs', label: 'Cabs', icon: Car },
];

export default function BookingHub() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<BookingSection>('flights');
  const [loading, setLoading] = useState(false);
  
  // Common form state
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [passengers, setPassengers] = useState("1");
  const [rooms, setRooms] = useState("1");
  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");

  // Results
  const [flights, setFlights] = useState<any[]>([]);
  const [trains, setTrains] = useState<any[]>([]);
  const [buses, setBuses] = useState<any[]>([]);

  const handleSearch = async () => {
    if (activeSection === 'hotels' || activeSection === 'cabs') {
      toast({ title: "Coming Soon", description: `${activeSection} booking will be available soon!` });
      return;
    }

    const validation = searchSchema.safeParse({
      from: origin,
      to: destination,
      date: departureDate,
      passengers: parseInt(passengers) || 1
    });

    if (!validation.success) {
      toast({ title: "Invalid Search", description: validation.error.issues[0].message, variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const functionMap = { flights: 'search-flights', trains: 'search-trains', buses: 'search-buses' };
      const functionName = functionMap[activeSection as keyof typeof functionMap];

      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { from: validation.data.from, to: validation.data.to, date: validation.data.date, passengers: validation.data.passengers }
      });

      if (error) throw error;

      if (activeSection === 'flights') setFlights(data.flights || []);
      else if (activeSection === 'trains') setTrains(data.trains || []);
      else if (activeSection === 'buses') setBuses(data.buses || []);

      toast({ title: "Search Complete", description: `Found ${data[activeSection]?.length || 0} options` });
    } catch {
      toast({ title: "Search Failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleBook = (item: any, type: string) => {
    navigate('/book-confirm', { state: { bookingType: type, booking: item } });
  };

  const renderResults = () => {
    const results = activeSection === 'flights' ? flights : activeSection === 'trains' ? trains : buses;
    
    if (results.length === 0) {
      return (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Search to see available {activeSection}</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        {results.map((item: any) => (
          <Card key={item.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="font-semibold text-lg">{item.airline || item.name || item.operator}</h3>
                    <span className="text-sm text-muted-foreground">{item.flightNumber || item.trainNumber || item.busType}</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-2xl font-bold">{item.departureTime}</p>
                      <p className="text-sm text-muted-foreground">{item.fromCode || item.from}</p>
                    </div>
                    <div className="flex-1 flex items-center gap-2">
                      <div className="h-px flex-1 bg-border"></div>
                      <span className="text-xs text-muted-foreground px-2">{item.duration}</span>
                      <div className="h-px flex-1 bg-border"></div>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{item.arrivalTime}</p>
                      <p className="text-sm text-muted-foreground">{item.toCode || item.to}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right ml-6">
                  <p className="text-3xl font-bold text-primary">₹{(item.price || (item.classes && Object.values(item.classes)[0] as any)?.price || 0).toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground mb-3">{item.seatsAvailable || (item.classes as any)?.SL?.available || 'Available'} seats</p>
                  <Button onClick={() => handleBook(item, activeSection.slice(0, -1))}>Book Now</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header with Section Nav */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Book Your Journey</h1>
            <p className="text-muted-foreground">Find the best deals on flights, trains, buses, hotels & cabs</p>
          </div>
          
          {/* Section Navigation - Top Right */}
          <div className="flex items-center gap-1 bg-muted p-1 rounded-xl">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeSection === id 
                    ? 'bg-background shadow-md text-foreground' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Search Form */}
        <Card className="mb-8 border-2 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b">
            <CardTitle className="flex items-center gap-2">
              {SECTIONS.find(s => s.id === activeSection)?.icon && (
                <span className="p-2 bg-primary rounded-lg">
                  {(() => { const Icon = SECTIONS.find(s => s.id === activeSection)!.icon; return <Icon className="h-5 w-5 text-primary-foreground" />; })()}
                </span>
              )}
              Search {SECTIONS.find(s => s.id === activeSection)?.label}
            </CardTitle>
            <CardDescription>Enter your travel details to find the best options</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {activeSection === 'hotels' ? (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="md:col-span-1">
                  <Label className="flex items-center gap-2 mb-2"><MapPin size={14} /> Destination</Label>
                  <Input placeholder="City or Hotel name" value={destination} onChange={(e) => setDestination(e.target.value)} />
                </div>
                <div>
                  <Label className="flex items-center gap-2 mb-2"><Calendar size={14} /> Check-in</Label>
                  <Input type="date" value={checkInDate} onChange={(e) => setCheckInDate(e.target.value)} />
                </div>
                <div>
                  <Label className="flex items-center gap-2 mb-2"><Calendar size={14} /> Check-out</Label>
                  <Input type="date" value={checkOutDate} onChange={(e) => setCheckOutDate(e.target.value)} />
                </div>
                <div>
                  <Label className="flex items-center gap-2 mb-2"><Users size={14} /> Rooms</Label>
                  <Input type="number" min="1" value={rooms} onChange={(e) => setRooms(e.target.value)} />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleSearch} disabled={loading} className="w-full">
                    <Search className="mr-2 h-4 w-4" /> {loading ? 'Searching...' : 'Search'}
                  </Button>
                </div>
              </div>
            ) : activeSection === 'cabs' ? (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <Label className="flex items-center gap-2 mb-2"><MapPin size={14} /> Pickup Location</Label>
                  <Input placeholder="Enter pickup point" value={origin} onChange={(e) => setOrigin(e.target.value)} />
                </div>
                <div>
                  <Label className="flex items-center gap-2 mb-2"><MapPin size={14} /> Drop Location</Label>
                  <Input placeholder="Enter destination" value={destination} onChange={(e) => setDestination(e.target.value)} />
                </div>
                <div>
                  <Label className="flex items-center gap-2 mb-2"><Calendar size={14} /> Date</Label>
                  <Input type="date" value={departureDate} onChange={(e) => setDepartureDate(e.target.value)} />
                </div>
                <div>
                  <Label className="flex items-center gap-2 mb-2"><Clock size={14} /> Time</Label>
                  <Input type="time" value={departureTime} onChange={(e) => setDepartureTime(e.target.value)} />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleSearch} disabled={loading} className="w-full">
                    <Search className="mr-2 h-4 w-4" /> {loading ? 'Searching...' : 'Search'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <Label className="flex items-center gap-2 mb-2"><MapPin size={14} /> Origin</Label>
                  <Input placeholder="From city" value={origin} onChange={(e) => setOrigin(e.target.value)} />
                </div>
                <div>
                  <Label className="flex items-center gap-2 mb-2"><MapPin size={14} /> Destination</Label>
                  <Input placeholder="To city" value={destination} onChange={(e) => setDestination(e.target.value)} />
                </div>
                <div>
                  <Label className="flex items-center gap-2 mb-2"><Calendar size={14} /> Departure Date</Label>
                  <Input type="date" value={departureDate} onChange={(e) => setDepartureDate(e.target.value)} />
                </div>
                <div>
                  <Label className="flex items-center gap-2 mb-2"><Users size={14} /> Passengers</Label>
                  <Input type="number" min="1" max="9" value={passengers} onChange={(e) => setPassengers(e.target.value)} />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleSearch} disabled={loading} className="w-full">
                    <Search className="mr-2 h-4 w-4" /> {loading ? 'Searching...' : 'Search'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        {(activeSection === 'flights' || activeSection === 'trains' || activeSection === 'buses') && renderResults()}
        
        {(activeSection === 'hotels' || activeSection === 'cabs') && (
          <Card className="border-dashed">
            <CardContent className="p-12 text-center">
              <div className="text-6xl mb-4">{activeSection === 'hotels' ? '🏨' : '🚕'}</div>
              <h3 className="text-xl font-semibold mb-2">{activeSection === 'hotels' ? 'Hotel' : 'Cab'} Booking Coming Soon!</h3>
              <p className="text-muted-foreground">We're working on bringing you the best {activeSection} options. Stay tuned!</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
