import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardNav from "@/components/DashboardNav";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Search, UserPlus, MessageCircle, UserCheck, Clock, MapPin, Users, FileText, Heart } from "lucide-react";

interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  interests: string[] | null;
  home_location: string | null;
  is_public: boolean;
}

interface Post {
  id: string;
  content: string;
  image_url: string | null;
  user_id: string;
  created_at: string;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

interface SearchResult extends Profile {
  connection_status: string;
  can_message: boolean;
}

const SearchUsers = () => {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [profileResults, setProfileResults] = useState<SearchResult[]>([]);
  const [postResults, setPostResults] = useState<Post[]>([]);
  const [placeResults, setPlaceResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("profiles");
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (initialQuery && currentUserId) {
      performSearch();
    }
  }, [initialQuery, currentUserId]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/login");
      return;
    }
    setCurrentUserId(user.id);
  };

  const performSearch = async () => {
    if (!searchQuery.trim() || !currentUserId) return;

    setLoading(true);
    try {
      // Search profiles by name, interests, and location
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .or(`full_name.ilike.%${searchQuery}%,home_location.ilike.%${searchQuery}%,bio.ilike.%${searchQuery}%`)
        .neq("id", currentUserId)
        .limit(20);

      if (profilesError) throw profilesError;

      // Also search by interests (array contains)
      const { data: interestProfiles } = await supabase
        .from("profiles")
        .select("*")
        .contains("interests", [searchQuery])
        .neq("id", currentUserId)
        .limit(10);

      // Merge and dedupe profiles
      const allProfiles = [...(profiles || [])];
      interestProfiles?.forEach(p => {
        if (!allProfiles.find(existing => existing.id === p.id)) {
          allProfiles.push(p);
        }
      });

      const profilesWithStatus = await Promise.all(
        allProfiles.map(async (profile) => {
          const { data: statusData } = await supabase.rpc("get_connection_status", {
            user1_id: currentUserId,
            user2_id: profile.id,
          });
          const canMessage = statusData === "connected" || profile.is_public;
          return { ...profile, connection_status: statusData || "none", can_message: canMessage };
        })
      );

      setProfileResults(profilesWithStatus);

      // Search posts
      const { data: posts } = await supabase
        .from("posts")
        .select(`*, profiles:user_id (full_name, avatar_url)`)
        .ilike("content", `%${searchQuery}%`)
        .order("created_at", { ascending: false })
        .limit(20);

      setPostResults(posts || []);

      // Search trips/places
      const { data: trips } = await supabase
        .from("trips")
        .select("*")
        .or(`destination.ilike.%${searchQuery}%,title.ilike.%${searchQuery}%`)
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(20);

      setPlaceResults(trips || []);

    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const sendConnectionRequest = async (targetUserId: string) => {
    if (!currentUserId) return;

    try {
      const { error } = await supabase.from("user_connections").insert({
        requester_id: currentUserId,
        addressee_id: targetUserId,
        status: "pending",
      });

      if (error) throw error;
      toast({ title: "Request Sent", description: "Connection request sent successfully" });
      performSearch();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch();
  };

  const renderConnectionButton = (result: SearchResult) => {
    switch (result.connection_status) {
      case "connected":
        return (
          <Button variant="outline" size="sm" disabled>
            <UserCheck className="h-4 w-4 mr-1" /> Connected
          </Button>
        );
      case "pending_sent":
        return (
          <Button variant="outline" size="sm" disabled>
            <Clock className="h-4 w-4 mr-1" /> Pending
          </Button>
        );
      case "pending_received":
        return (
          <Button variant="outline" size="sm" disabled>
            <Clock className="h-4 w-4 mr-1" /> Received
          </Button>
        );
      default:
        return (
          <Button size="sm" onClick={() => sendConnectionRequest(result.id)}>
            <UserPlus className="h-4 w-4 mr-1" /> Connect
          </Button>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Search</h1>
          <p className="text-muted-foreground">Find profiles, posts, places, and interests</p>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                placeholder="Search profiles, posts, places, interests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={loading}>
                <Search className="h-4 w-4 mr-2" />
                {loading ? "Searching..." : "Search"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="profiles" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Profiles ({profileResults.length})
            </TabsTrigger>
            <TabsTrigger value="posts" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Posts ({postResults.length})
            </TabsTrigger>
            <TabsTrigger value="places" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Places ({placeResults.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profiles">
            {profileResults.length === 0 && !loading && searchQuery && (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No profiles found matching "{searchQuery}"</p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {profileResults.map((result) => (
                <Card key={result.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 cursor-pointer" onClick={() => navigate(`/profile/${result.id}`)}>
                        <AvatarImage src={result.avatar_url || undefined} />
                        <AvatarFallback>{getInitials(result.full_name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base cursor-pointer hover:underline" onClick={() => navigate(`/profile/${result.id}`)}>
                          {result.full_name || "Anonymous"}
                        </CardTitle>
                        {result.home_location && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {result.home_location}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {result.bio && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{result.bio}</p>
                    )}
                    {result.interests && result.interests.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {result.interests.slice(0, 3).map((interest, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">{interest}</Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      {result.can_message && (
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate(`/`, { state: { openMessages: true, userId: result.id } })}>
                          <MessageCircle className="h-4 w-4 mr-1" /> Message
                        </Button>
                      )}
                      {renderConnectionButton(result)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="posts">
            {postResults.length === 0 && !loading && searchQuery && (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No posts found matching "{searchQuery}"</p>
              </div>
            )}
            <div className="grid gap-4">
              {postResults.map((post) => (
                <Card key={post.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/profile/${post.user_id}`)}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={post.profiles?.avatar_url || undefined} />
                        <AvatarFallback>{getInitials(post.profiles?.full_name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{post.profiles?.full_name || "User"}</p>
                        <p className="text-muted-foreground text-sm line-clamp-2">{post.content}</p>
                        {post.image_url && (
                          <img src={post.image_url} alt="Post" className="mt-2 rounded-lg max-h-40 object-cover" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="places">
            {placeResults.length === 0 && !loading && searchQuery && (
              <div className="text-center py-12 text-muted-foreground">
                <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No places found matching "{searchQuery}"</p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {placeResults.map((trip) => (
                <Card key={trip.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                  {trip.image_url && (
                    <img src={trip.image_url} alt={trip.destination} className="w-full h-40 object-cover" />
                  )}
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-1">{trip.title}</h3>
                    <p className="text-muted-foreground flex items-center gap-1 mb-2">
                      <MapPin className="h-4 w-4" /> {trip.destination}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Heart className="h-4 w-4" /> {trip.likes_count || 0}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SearchUsers;