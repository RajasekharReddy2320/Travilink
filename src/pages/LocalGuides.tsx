import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, MapPin, Languages, ArrowLeft, CheckCircle, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface LocalGuide {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  reviews: number;
  languages: string[];
  place: string;
  expertise: string[];
  hourlyRate: number;
  dayRate: number;
  experience: string;
  description: string;
  availability: string;
  topAttractions: string[];
}

const localGuides: LocalGuide[] = [
  {
    id: "1",
    name: "Ramesh Gupta",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ramesh",
    rating: 4.9,
    reviews: 187,
    languages: ["Hindi", "English", "Punjabi"],
    place: "Jaipur",
    expertise: ["Heritage Tours", "Photography Spots", "Local Cuisine"],
    hourlyRate: 500,
    dayRate: 3500,
    experience: "12 years",
    availability: "Available",
    description: "Born and raised in Jaipur, I'll show you the hidden gems of the Pink City.",
    topAttractions: ["Hawa Mahal", "Amber Fort", "City Palace"]
  },
  {
    id: "2",
    name: "Lakshmi Nair",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lakshmi",
    rating: 4.8,
    reviews: 142,
    languages: ["Malayalam", "Tamil", "English"],
    place: "Kochi",
    expertise: ["Backwater Tours", "Ayurveda", "Spice Gardens"],
    hourlyRate: 600,
    dayRate: 4000,
    experience: "8 years",
    availability: "Available",
    description: "Discover Kerala's natural beauty and traditional wellness practices.",
    topAttractions: ["Fort Kochi", "Marine Drive", "Jew Town"]
  },
  {
    id: "3",
    name: "Suresh Reddy",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Suresh",
    rating: 4.7,
    reviews: 165,
    languages: ["Telugu", "Hindi", "English"],
    place: "Hyderabad",
    expertise: ["Historical Sites", "Biryani Tours", "Shopping"],
    hourlyRate: 550,
    dayRate: 3800,
    experience: "10 years",
    availability: "Busy",
    description: "Let me take you through Hyderabad's rich history and culinary delights.",
    topAttractions: ["Charminar", "Golconda Fort", "Hussain Sagar"]
  },
  {
    id: "4",
    name: "Anjali Desai",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Anjali",
    rating: 4.9,
    reviews: 203,
    languages: ["Gujarati", "Hindi", "English"],
    place: "Ahmedabad",
    expertise: ["Textile Tours", "Street Food", "Temples"],
    hourlyRate: 650,
    dayRate: 4200,
    experience: "15 years",
    availability: "Available",
    description: "Explore Gujarat's vibrant culture, textiles, and mouth-watering street food.",
    topAttractions: ["Sabarmati Ashram", "Adalaj Stepwell", "Manek Chowk"]
  },
  {
    id: "5",
    name: "Karan Mehta",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Karan",
    rating: 4.8,
    reviews: 178,
    languages: ["Hindi", "English", "Marathi"],
    place: "Mumbai",
    expertise: ["Bollywood", "Street Art", "Nightlife"],
    hourlyRate: 700,
    dayRate: 4500,
    experience: "9 years",
    availability: "Available",
    description: "Experience the energy of Mumbai through Bollywood, art, and local hotspots.",
    topAttractions: ["Gateway of India", "Marine Drive", "Colaba Causeway"]
  },
  {
    id: "6",
    name: "Sanjay Kumar",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sanjay",
    rating: 4.6,
    reviews: 134,
    languages: ["Hindi", "English", "Bhojpuri"],
    place: "Varanasi",
    expertise: ["Spiritual Tours", "Ghats", "Ancient Rituals"],
    hourlyRate: 500,
    dayRate: 3200,
    experience: "20 years",
    availability: "Available",
    description: "Walk through centuries of spirituality in one of the world's oldest cities.",
    topAttractions: ["Dashashwamedh Ghat", "Kashi Vishwanath", "Assi Ghat"]
  },
  {
    id: "7",
    name: "Priya Singh",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=PriyaGuide",
    rating: 4.9,
    reviews: 289,
    languages: ["Hindi", "English", "Urdu"],
    place: "Agra",
    expertise: ["Mughal History", "Monument Photography", "Marble Craft"],
    hourlyRate: 800,
    dayRate: 5000,
    experience: "14 years",
    availability: "Available",
    description: "Experience the Taj Mahal and Agra's wonders with an expert historian guide.",
    topAttractions: ["Taj Mahal", "Agra Fort", "Fatehpur Sikri"]
  }
];

export default function LocalGuides() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedGuide, setSelectedGuide] = useState<string | null>(null);
  const [bookingType, setBookingType] = useState<"hourly" | "day">("day");

  const handleBook = (guide: LocalGuide) => {
    setSelectedGuide(guide.id);
    const rate = bookingType === "hourly" ? guide.hourlyRate : guide.dayRate;
    toast({
      title: "Booking Request Sent!",
      description: `${guide.name} will confirm your ${bookingType === "hourly" ? "hourly" : "full day"} booking at ₹${rate}.`,
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
          <h1 className="text-4xl font-bold mb-2">Connect with Local Guides</h1>
          <p className="text-muted-foreground text-lg">
            Book experienced local guides who know the ins and outs of their cities
          </p>
        </div>

        <Tabs defaultValue="day" className="mb-6" onValueChange={(v) => setBookingType(v as "hourly" | "day")}>
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="hourly">Hourly Booking</TabsTrigger>
            <TabsTrigger value="day">Full Day Booking</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {localGuides.map((guide) => (
            <Card key={guide.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={guide.avatar} alt={guide.name} />
                    <AvatarFallback>{guide.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {guide.name}
                      {selectedGuide === guide.id && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold text-sm">{guide.rating}</span>
                      <span className="text-muted-foreground text-xs">({guide.reviews})</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <CardDescription className="text-xs">{guide.description}</CardDescription>
                
                <div className="flex items-center gap-2 text-xs">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  <span>Local guide in {guide.place}</span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <Languages className="h-3 w-3 text-muted-foreground" />
                  <span>{guide.languages.join(", ")}</span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <Badge variant={guide.availability === "Available" ? "default" : "secondary"} className="text-xs">
                    {guide.availability}
                  </Badge>
                </div>

                <div>
                  <p className="text-xs font-semibold mb-1">Specialties</p>
                  <div className="flex flex-wrap gap-1">
                    {guide.expertise.slice(0, 2).map((exp) => (
                      <Badge key={exp} variant="secondary" className="text-xs">{exp}</Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold mb-1">Top Attractions</p>
                  <div className="flex flex-wrap gap-1">
                    {guide.topAttractions.map((attr) => (
                      <Badge key={attr} variant="outline" className="text-xs">{attr}</Badge>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold text-primary">
                      ₹{bookingType === "hourly" ? guide.hourlyRate : guide.dayRate}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      /{bookingType === "hourly" ? "hour" : "day"}
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  onClick={() => handleBook(guide)}
                  disabled={selectedGuide === guide.id || guide.availability === "Busy"}
                  size="sm"
                >
                  {selectedGuide === guide.id ? "Request Sent" : "Book Now"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate("/travel-agents")}
          >
            Or Work with Travel Agents Instead
          </Button>
        </div>
      </div>
    </div>
  );
}
