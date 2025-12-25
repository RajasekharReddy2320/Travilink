import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import DashboardNav from "@/components/DashboardNav";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useConnectionActions } from "@/hooks/useConnectionActions";
import { 
  UserPlus, MessageCircle, UserCheck, Clock, MapPin, 
  Globe, Languages, Loader2, UserMinus 
} from "lucide-react";

interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  interests: string[] | null;
  home_location: string | null;
  country: string | null;
  state: string | null;
  languages_spoken: string[] | null;
  travel_preferences: string[] | null;
  budget_range: string | null;
  is_public: boolean;
}

const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>("none");
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { toast } = useToast();
  const { sendConnectionRequest, cancelConnectionRequest, removeConnection } = useConnectionActions();

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }
      setCurrentUserId(user.id);

      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Get connection status
      const { data: statusData } = await supabase.rpc("get_connection_status", {
        user1_id: user.id,
        user2_id: userId,
      });

      setConnectionStatus(statusData || "none");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!currentUserId || !userId) return;

    const success = await sendConnectionRequest(currentUserId, userId);
    if (success) {
      setConnectionStatus("pending_sent");
    }
  };

  const handleCancelRequest = async () => {
    if (!currentUserId || !userId) return;

    const success = await cancelConnectionRequest(currentUserId, userId);
    if (success) {
      setConnectionStatus("none");
    }
  };

  const handleRemoveConnection = async () => {
    if (!currentUserId || !userId) return;

    const success = await removeConnection(currentUserId, userId);
    if (success) {
      setConnectionStatus("none");
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const renderConnectionButton = () => {
    switch (connectionStatus) {
      case "connected":
        return (
          <Button variant="outline" onClick={handleRemoveConnection}>
            <UserMinus className="h-4 w-4 mr-2" />
            Remove Connection
          </Button>
        );
      case "pending_sent":
        return (
          <Button variant="outline" onClick={handleCancelRequest}>
            <Clock className="h-4 w-4 mr-2" />
            Cancel Request
          </Button>
        );
      case "pending_received":
        return (
          <Button variant="outline" disabled>
            <Clock className="h-4 w-4 mr-2" />
            Request Received
          </Button>
        );
      default:
        return (
          <Button onClick={handleConnect}>
            <UserPlus className="h-4 w-4 mr-2" />
            Connect
          </Button>
        );
    }
  };

  const canViewFullProfile = connectionStatus === "connected" || profile?.is_public;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardNav />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardNav />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Profile not found</p>
              <Button onClick={() => navigate(-1)} className="mt-4">
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-start gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="text-2xl">
                  {getInitials(profile.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <CardTitle className="text-3xl mb-2">
                  {profile.full_name || "Anonymous User"}
                </CardTitle>
                {canViewFullProfile && profile.home_location && (
                  <div className="flex items-center text-muted-foreground mb-4">
                    <MapPin className="h-4 w-4 mr-1" />
                    {profile.home_location}
                    {profile.state && `, ${profile.state}`}
                    {profile.country && `, ${profile.country}`}
                  </div>
                )}
                <div className="flex gap-2">
                  {renderConnectionButton()}
                  {(connectionStatus === "connected" || profile.is_public) && (
                    <Button
                      variant="outline"
                      onClick={() => navigate(`/messages?user=${userId}`)}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Message
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {!canViewFullProfile && (
              <div className="text-center py-8 text-muted-foreground">
                <p>Connect with this user to view their full profile</p>
              </div>
            )}

            {canViewFullProfile && (
              <>
                {profile.bio && (
                  <div>
                    <h3 className="font-semibold mb-2">About</h3>
                    <p className="text-muted-foreground">{profile.bio}</p>
                  </div>
                )}

                {profile.interests && profile.interests.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Interests</h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.interests.map((interest, idx) => (
                        <Badge key={idx} variant="secondary">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {profile.travel_preferences && profile.travel_preferences.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Travel Preferences</h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.travel_preferences.map((pref, idx) => (
                        <Badge key={idx} variant="outline">
                          <Globe className="h-3 w-3 mr-1" />
                          {pref}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {profile.languages_spoken && profile.languages_spoken.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Languages</h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.languages_spoken.map((lang, idx) => (
                        <Badge key={idx} variant="outline">
                          <Languages className="h-3 w-3 mr-1" />
                          {lang}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {profile.budget_range && (
                  <div>
                    <h3 className="font-semibold mb-2">Budget Range</h3>
                    <Badge variant="secondary">{profile.budget_range}</Badge>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserProfile;
