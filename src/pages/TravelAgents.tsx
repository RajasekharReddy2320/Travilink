import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, MapPin, Users, ArrowLeft, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TravelAgency {
  id: string;
  name: string;
  logo: string;
  rating: number;
  reviews: number;
  specialization: string[];
  established: string;
  locations: string[];
  planningFee: number;
  tripsPlanned: number;
  description: string;
  teamSize: number;
}

const travelAgencies: TravelAgency[] = [
  {
    id: "1",
    name: "Himalayan Explorers",
    logo: "https://api.dicebear.com/7.x/shapes/svg?seed=Himalayan",
    rating: 4.9,
    reviews: 1234,
    specialization: ["Adventure", "Mountain Treks", "Trekking"],
    established: "2010",
    locations: ["Delhi", "Manali", "Leh"],
    planningFee: 999,
    tripsPlanned: 5200,
    teamSize: 25,
    description: "Leading adventure travel agency specializing in Himalayan expeditions and mountain tourism with expert guides."
  },
  {
    id: "2",
    name: "Coastal Dreams Travel",
    logo: "https://api.dicebear.com/7.x/shapes/svg?seed=Coastal",
    rating: 4.8,
    reviews: 989,
    specialization: ["Beach", "Honeymoon", "Luxury Resorts"],
    established: "2012",
    locations: ["Mumbai", "Goa", "Kerala"],
    planningFee: 1299,
    tripsPlanned: 4180,
    teamSize: 18,
    description: "Premium beach and luxury resort specialists offering curated romantic getaways and coastal experiences."
  },
  {
    id: "3",
    name: "Heritage Trails India",
    logo: "https://api.dicebear.com/7.x/shapes/svg?seed=Heritage",
    rating: 4.7,
    reviews: 756,
    specialization: ["Cultural Tours", "Heritage Sites", "Historical"],
    established: "2008",
    locations: ["Jaipur", "Agra", "Varanasi"],
    planningFee: 799,
    tripsPlanned: 3890,
    teamSize: 15,
    description: "Cultural tourism experts offering immersive heritage experiences across India's historical landmarks."
  },
  {
    id: "4",
    name: "Wildlife Wanderers",
    logo: "https://api.dicebear.com/7.x/shapes/svg?seed=Wildlife",
    rating: 4.9,
    reviews: 1567,
    specialization: ["Wildlife", "Safaris", "Photography Tours"],
    established: "2005",
    locations: ["Bangalore", "Ranthambore", "Jim Corbett"],
    planningFee: 1499,
    tripsPlanned: 6820,
    teamSize: 32,
    description: "India's premier wildlife safari agency with exclusive access to top national parks and expert naturalists."
  },
  {
    id: "5",
    name: "Budget Backpackers",
    logo: "https://api.dicebear.com/7.x/shapes/svg?seed=Budget",
    rating: 4.6,
    reviews: 642,
    specialization: ["Budget Travel", "Backpacking", "Youth Travel"],
    established: "2015",
    locations: ["Delhi", "Mumbai", "Bangalore"],
    planningFee: 599,
    tripsPlanned: 2810,
    teamSize: 12,
    description: "Affordable travel solutions for young adventurers exploring India on a budget without compromising experiences."
  },
  {
    id: "6",
    name: "Family First Holidays",
    logo: "https://api.dicebear.com/7.x/shapes/svg?seed=Family",
    rating: 4.8,
    reviews: 1098,
    specialization: ["Family Tours", "Kid-Friendly", "Theme Parks"],
    established: "2011",
    locations: ["Chennai", "Hyderabad", "Pune"],
    planningFee: 899,
    tripsPlanned: 4645,
    teamSize: 20,
    description: "Family vacation specialists creating memorable multi-generational travel experiences across India."
  },
  {
    id: "7",
    name: "Global Getaways",
    logo: "https://api.dicebear.com/7.x/shapes/svg?seed=Global",
    rating: 4.9,
    reviews: 2112,
    specialization: ["International", "Europe", "Visa Services"],
    established: "2003",
    locations: ["Delhi", "Mumbai", "Bangalore"],
    planningFee: 1999,
    tripsPlanned: 8780,
    teamSize: 45,
    description: "Full-service international travel agency with expertise in European tours, visa assistance, and global destinations."
  }
];

export default function TravelAgents() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedAgency, setSelectedAgency] = useState<string | null>(null);

  const handleConnect = (agency: TravelAgency) => {
    setSelectedAgency(agency.id);
    toast({
      title: "Connection Request Sent!",
      description: `${agency.name} will contact you shortly to plan your perfect trip.`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-4xl font-bold mb-2">Travel Agencies</h1>
          <p className="text-muted-foreground text-lg">
            Connect with trusted travel agencies to plan your perfect trip
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {travelAgencies.map((agency) => (
            <Card key={agency.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={agency.logo} alt={agency.name} />
                    <AvatarFallback>{agency.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {agency.name}
                      {selectedAgency === agency.id && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">{agency.rating}</span>
                      <span className="text-muted-foreground text-sm">({agency.reviews})</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <CardDescription>{agency.description}</CardDescription>
                
                <div className="flex flex-wrap gap-2">
                  {agency.specialization.map((spec) => (
                    <Badge key={spec} variant="secondary">{spec}</Badge>
                  ))}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{agency.locations.join(", ")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{agency.tripsPlanned}+ trips planned | Team: {agency.teamSize}</span>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-primary">₹{agency.planningFee}</span>
                    <span className="text-muted-foreground text-sm">planning fee</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  onClick={() => handleConnect(agency)}
                  disabled={selectedAgency === agency.id}
                >
                  {selectedAgency === agency.id ? "Request Sent" : "Connect & Plan Trip"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate("/local-guides")}
          >
            Or Connect with Local Guides Instead
          </Button>
        </div>
      </div>
    </div>
  );
}
