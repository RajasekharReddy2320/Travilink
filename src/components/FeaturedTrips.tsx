import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Users, IndianRupee, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Trip {
  id: string;
  title: string;
  destination: string;
  start_date: string;
  end_date: string;
  budget_inr: number;
  group_size: number;
  interests: string[];
  likes_count: number;
  image_url: string | null;
}

export default function FeaturedTrips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedTrips();
  }, []);

  const fetchFeaturedTrips = async () => {
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .eq('is_public', true)
      .order('likes_count', { ascending: false })
      .limit(3);

    if (!error && data) {
      setTrips(data);
    }
    setLoading(false);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <section className="py-16 bg-accent/5">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Featured Trips</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-muted" />
                <CardHeader>
                  <div className="h-6 bg-muted rounded mb-2" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (trips.length === 0) return null;

  return (
    <section className="py-16 bg-accent/5">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">Trending Trips</h2>
          <p className="text-muted-foreground">Discover popular itineraries from our community</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {trips.map((trip) => (
            <Card key={trip.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {trip.image_url && (
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={trip.image_url} 
                    alt={trip.destination}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3 bg-white/90 dark:bg-black/90 rounded-full px-3 py-1 flex items-center gap-1">
                    <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                    <span className="text-sm font-semibold">{trip.likes_count}</span>
                  </div>
                </div>
              )}
              <CardHeader>
                <CardTitle className="line-clamp-1">{trip.title}</CardTitle>
                <CardDescription className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {trip.destination}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{trip.group_size} {trip.group_size === 1 ? 'person' : 'people'}</span>
                  </div>
                  <div className="flex items-center gap-1 font-semibold text-primary">
                    <IndianRupee className="h-4 w-4" />
                    {(trip.budget_inr / 1000).toFixed(0)}K
                  </div>
                </div>

                {trip.interests && trip.interests.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {trip.interests.slice(0, 3).map((interest, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                )}

                <Link to="/wanderlust">
                  <Button variant="outline" className="w-full">
                    View Details
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Link to="/wanderlust">
            <Button size="lg">
              Explore All Trips
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
