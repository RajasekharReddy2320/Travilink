import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Phone, MapPin, Globe, Calendar, LogOut, MessageCircle, UserPlus, UserCheck, UserMinus, Lock, Unlock, X, Star, FileText, Users as UsersIcon, Ticket } from "lucide-react";
import DashboardNav from "@/components/DashboardNav";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { z } from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PostCard } from "@/components/PostCard";
import { TravelGroupCard } from "@/components/TravelGroupCard";
import { formatDistanceToNow } from "date-fns";

const reviewSchema = z.object({
  rating: z.number().min(1, "Please select a rating").max(5),
  review_text: z.string().trim().min(10, "Review must be at least 10 characters").max(1000, "Review must be less than 1000 characters")
});

interface Profile {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  bio: string | null;
  age: number | null;
  gender: string | null;
  date_of_birth: string | null;
  country: string | null;
  state: string | null;
  home_location: string | null;
  languages_spoken: string[] | null;
  interests: string[] | null;
  travel_preferences: string[] | null;
  avatar_url: string | null;
  is_public: boolean;
}

const Profile = () => {
  const navigate = useNavigate();
  const { userId } = useParams();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(true);
  const [likedTrips, setLikedTrips] = useState<any[]>([]);
  const [bucketList, setBucketList] = useState<any[]>([]);
  const [userTrips, setUserTrips] = useState<any[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<string>("none");
  const [canMessage, setCanMessage] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  
  // Review state
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Social activity state
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [userGroups, setUserGroups] = useState<any[]>([]);
  const [userBookings, setUserBookings] = useState<any[]>([]);
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());
  const [userSaves, setUserSaves] = useState<Set<string>>(new Set());
  const [userGroupMemberships, setUserGroupMemberships] = useState<Set<string>>(new Set());

  useEffect(() => {
    checkAuth();
  }, [userId]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/login");
      return;
    }

    setCurrentUserId(session.user.id);
    const targetUserId = userId || session.user.id;
    const isOwn = !userId || userId === session.user.id;
    setIsOwnProfile(isOwn);
    
    await loadProfile(targetUserId);
    await loadUserActivity(targetUserId);
    await loadSocialActivity(targetUserId, session.user.id);
    
    if (!isOwn) {
      await loadConnectionStatus(session.user.id, targetUserId);
    }
  };

  const loadConnectionStatus = async (currentId: string, targetId: string) => {
    const { data } = await supabase.rpc('get_connection_status', {
      user1_id: currentId,
      user2_id: targetId
    });

    const status = data || 'none';
    setConnectionStatus(status);

    // Check if user can message
    const { data: targetProfile } = await supabase
      .from("profiles")
      .select("is_public")
      .eq("id", targetId)
      .single();

    setCanMessage(connectionStatus === 'connected');
  };

  const loadProfile = async (targetUserId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", targetUserId)
      .maybeSingle();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    // If profile doesn't exist, create one
    if (!data && isOwnProfile) {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const newProfile = {
          id: user.id,
          email: user.email || "",
          full_name: user.user_metadata?.full_name || "",
          phone: null,
          bio: null,
          age: null,
          gender: null,
          date_of_birth: null,
          country: null,
          state: null,
          home_location: null,
          languages_spoken: [],
          interests: [],
          travel_preferences: [],
          avatar_url: null,
          is_public: true
        };

        const { error: insertError } = await supabase
          .from("profiles")
          .insert(newProfile);

        if (insertError) {
          toast({
            title: "Error",
            description: "Failed to create profile",
            variant: "destructive"
          });
        } else {
          setProfile(newProfile);
          toast({
            title: "Welcome!",
            description: "Your profile has been created. Please complete your details."
          });
          setEditing(true);
        }
      }
    } else {
      setProfile(data);
    }

    setLoading(false);
  };

  const loadUserActivity = async (targetUserId: string) => {
    // Load liked trips
    const { data: likes } = await supabase
      .from("trip_likes")
      .select(`
        trip_id,
        trips:trip_id (*)
      `)
      .eq("user_id", targetUserId);

    if (likes) {
      setLikedTrips(likes.map(l => l.trips).filter(Boolean));
    }

    // Load bucket list
    const { data: bucket } = await supabase
      .from("bucket_list")
      .select(`
        trip_id,
        trips:trip_id (*)
      `)
      .eq("user_id", targetUserId);

    if (bucket) {
      setBucketList(bucket.map(b => b.trips).filter(Boolean));
    }

    // Load user's trips
    const { data: trips } = await supabase
      .from("trips")
      .select("*")
      .eq("user_id", targetUserId)
      .order("created_at", { ascending: false });

    if (trips) {
      setUserTrips(trips);
    }
  };

  const loadSocialActivity = async (targetUserId: string, currentId: string) => {
    // Load user's posts
    const { data: posts } = await supabase
      .from("posts")
      .select(`
        *,
        profiles:user_id (
          full_name,
          avatar_url
        )
      `)
      .eq("user_id", targetUserId)
      .order("created_at", { ascending: false });

    if (posts) {
      setUserPosts(posts);
    }

    // Load user's travel groups (created)
    const { data: groups } = await supabase
      .from("travel_groups")
      .select(`
        *,
        profiles:creator_id (
          full_name,
          avatar_url
        )
      `)
      .eq("creator_id", targetUserId)
      .order("created_at", { ascending: false });

    if (groups) {
      const groupsWithCounts = await Promise.all(
        (groups || []).map(async (group: any) => {
          const { count } = await supabase
            .from("travel_group_members")
            .select("*", { count: "exact", head: true })
            .eq("group_id", group.id)
            .eq("status", "accepted");

          return { ...group, member_count: count || 0 };
        })
      );
      setUserGroups(groupsWithCounts);
    }

    // Load user's bookings
    const { data: bookings } = await supabase
      .from("bookings")
      .select("*")
      .eq("user_id", targetUserId)
      .order("created_at", { ascending: false });

    if (bookings) {
      setUserBookings(bookings);
    }

    // Load current user's interactions
    if (currentId) {
      const [likesData, savesData, membershipsData] = await Promise.all([
        supabase.from("post_likes").select("post_id").eq("user_id", currentId),
        supabase.from("post_saves").select("post_id").eq("user_id", currentId),
        supabase.from("travel_group_members").select("group_id").eq("user_id", currentId).eq("status", "accepted"),
      ]);

      if (likesData.data) setUserLikes(new Set(likesData.data.map((l: any) => l.post_id)));
      if (savesData.data) setUserSaves(new Set(savesData.data.map((s: any) => s.post_id)));
      if (membershipsData.data) setUserGroupMemberships(new Set(membershipsData.data.map((m: any) => m.group_id)));
    }
  };

  const handlePostUpdate = () => {
    if (currentUserId) {
      const targetUserId = userId || currentUserId;
      loadSocialActivity(targetUserId, currentUserId);
    }
  };

  const handleGroupUpdate = () => {
    if (currentUserId) {
      const targetUserId = userId || currentUserId;
      loadSocialActivity(targetUserId, currentUserId);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profile.full_name,
        phone: profile.phone,
        bio: profile.bio,
        age: profile.age,
        gender: profile.gender,
        date_of_birth: profile.date_of_birth,
        country: profile.country,
        state: profile.state,
        home_location: profile.home_location,
        languages_spoken: profile.languages_spoken,
        interests: profile.interests,
        travel_preferences: profile.travel_preferences,
        is_public: profile.is_public,
      })
      .eq("id", profile.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Success",
      description: "Profile updated successfully"
    });
    
    setEditing(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const handleConnectionAction = async () => {
    if (!profile) return;

    if (connectionStatus === 'none') {
      // Send connection request
      const { error } = await supabase
        .from("user_connections")
        .insert({
          requester_id: currentUserId,
          addressee_id: profile.id,
          status: "pending"
        });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to send connection request",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Request Sent",
        description: "Connection request sent successfully"
      });
      
      await loadConnectionStatus(currentUserId, profile.id);
    } else if (connectionStatus === 'pending_sent') {
      // Cancel request
      const { error } = await supabase
        .from("user_connections")
        .delete()
        .eq("requester_id", currentUserId)
        .eq("addressee_id", profile.id)
        .eq("status", "pending");

      if (error) {
        toast({
          title: "Error",
          description: "Failed to cancel request",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Request Cancelled",
        description: "Connection request cancelled"
      });
      
      await loadConnectionStatus(currentUserId, profile.id);
    } else if (connectionStatus === 'connected') {
      // Remove connection
      const { error } = await supabase
        .from("user_connections")
        .delete()
        .or(`and(requester_id.eq.${currentUserId},addressee_id.eq.${profile.id}),and(requester_id.eq.${profile.id},addressee_id.eq.${currentUserId})`)
        .eq("status", "accepted");

      if (error) {
        toast({
          title: "Error",
          description: "Failed to remove connection",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Connection Removed",
        description: "User removed from your connections"
      });
      
      await loadConnectionStatus(currentUserId, profile.id);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const handleSubmitReview = async () => {
    try {
      const validatedData = reviewSchema.parse({
        rating,
        review_text: reviewText
      });

      setIsSubmittingReview(true);

      const { error } = await supabase
        .from("reviews")
        .insert({
          user_id: currentUserId,
          full_name: profile?.full_name || "Anonymous",
          email: profile?.email || "",
          rating: validatedData.rating,
          review_text: validatedData.review_text
        });

      if (error) throw error;

      toast({
        title: "Thank you for your feedback!",
        description: "Your review has been submitted successfully.",
      });

      // Reset form
      setRating(0);
      setReviewText("");
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.issues[0];
        toast({
          title: "Validation Error",
          description: firstError?.message || "Invalid input",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to submit review. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-center">
          <User className="h-12 w-12 mx-auto mb-4 text-primary animate-bounce" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />

      <main className="container px-4 py-8 max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">{isOwnProfile ? "My Profile" : "Profile"}</h1>
          {isOwnProfile && (
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          )}
        </div>

        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="text-2xl">{getInitials(profile.full_name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-1">{profile.full_name || "User"}</h2>
                {isOwnProfile && (
                  <>
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <Mail className="h-4 w-4" />
                      {profile.email}
                    </div>
                    {profile.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        {profile.phone}
                      </div>
                    )}
                  </>
                )}
                {!isOwnProfile && connectionStatus !== 'connected' && (
                  <p className="text-sm text-muted-foreground">
                    Connect to view profile details
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                {!isOwnProfile && (
                  <>
                    {connectionStatus === 'none' && (
                      <Button onClick={handleConnectionAction}>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Connect
                      </Button>
                    )}
                    {connectionStatus === 'pending_sent' && (
                      <Button variant="outline" onClick={handleConnectionAction}>
                        <X className="mr-2 h-4 w-4" />
                        Cancel Request
                      </Button>
                    )}
                    {connectionStatus === 'pending_received' && (
                      <Button onClick={() => navigate('/connections')}>
                        View Request
                      </Button>
                    )}
                    {connectionStatus === 'connected' && (
                      <>
                        <Badge variant="secondary" className="flex items-center gap-1 px-3 py-1">
                          <UserCheck className="h-4 w-4" />
                          Connected
                        </Badge>
                        <Button variant="ghost" size="icon" onClick={handleConnectionAction}>
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {canMessage && (
                      <Button onClick={() => navigate('/wanderlust', { state: { selectedUserId: profile.id } })}>
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Message
                      </Button>
                    )}
                  </>
                )}
                {isOwnProfile && (
                  <Button onClick={() => setEditing(!editing)}>
                    {editing ? "Cancel" : "Edit Profile"}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Details - Only show if own profile or connected */}
        {(isOwnProfile || connectionStatus === 'connected') && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                {isOwnProfile ? "Your personal details and preferences" : `${profile.full_name || "User"}'s profile`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
            <div>
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={profile.full_name || ""}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                disabled={!editing}
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={profile.phone || ""}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                disabled={!editing}
                placeholder="Add phone number"
              />
            </div>

            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={profile.bio || ""}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                disabled={!editing}
                placeholder="Tell us about yourself"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={profile.age || ""}
                  onChange={(e) => setProfile({ ...profile, age: parseInt(e.target.value) || null })}
                  disabled={!editing}
                  placeholder="Add age"
                />
              </div>

              <div>
                <Label htmlFor="gender">Gender</Label>
                <Input
                  id="gender"
                  value={profile.gender || ""}
                  onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                  disabled={!editing}
                  placeholder="Add gender"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="dob">Date of Birth</Label>
              <Input
                id="dob"
                type="date"
                value={profile.date_of_birth || ""}
                onChange={(e) => setProfile({ ...profile, date_of_birth: e.target.value })}
                disabled={!editing}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={profile.country || ""}
                  onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                  disabled={!editing}
                  placeholder="Add country"
                />
              </div>

              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={profile.state || ""}
                  onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                  disabled={!editing}
                  placeholder="Add state"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="home_location">Home Location</Label>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="home_location"
                  value={profile.home_location || ""}
                  onChange={(e) => setProfile({ ...profile, home_location: e.target.value })}
                  disabled={!editing}
                  placeholder="Add home location"
                  className="flex-1"
                />
              </div>
            </div>

            {editing && (
              <div className="pt-4">
                <Button onClick={handleSave} className="w-full">
                  Save Changes
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        )}

        {/* Privacy Settings */}
        {isOwnProfile && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {profile.is_public ? <Unlock className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                Privacy Settings
              </CardTitle>
              <CardDescription>
                Control who can view your profile and message you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="privacy-toggle" className="text-base">
                    Public Profile
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {profile.is_public 
                      ? "Anyone can view your profile and send you messages" 
                      : "Only connected users can view your full profile and message you"}
                  </p>
                </div>
                <Switch
                  id="privacy-toggle"
                  checked={profile.is_public}
                  onCheckedChange={(checked) => setProfile({ ...profile, is_public: checked })}
                  disabled={!editing}
                />
              </div>
              
              {!profile.is_public && (
                <div className="rounded-lg bg-muted p-4">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Private Profile Features
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Only connected users can see your full profile</li>
                    <li>Others can only see your name and profile picture</li>
                    <li>Only connected users can message you</li>
                    <li>You appear in search with limited information</li>
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Languages - Only show if own profile or connected */}
        {(isOwnProfile || connectionStatus === 'connected') && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Languages Spoken
              </CardTitle>
            </CardHeader>
            <CardContent>
              {profile.languages_spoken && profile.languages_spoken.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.languages_spoken.map((lang) => (
                    <Badge key={lang} variant="secondary">{lang}</Badge>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No languages added yet</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Interests - Only show if own profile or connected */}
        {(isOwnProfile || connectionStatus === 'connected') && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Travel Interests</CardTitle>
            </CardHeader>
            <CardContent>
              {profile.interests && profile.interests.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map((interest) => (
                    <Badge key={interest} variant="outline">{interest}</Badge>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No interests added yet</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Travel Preferences - Only show if own profile or connected */}
        {(isOwnProfile || connectionStatus === 'connected') && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Travel Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              {profile.travel_preferences && profile.travel_preferences.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.travel_preferences.map((pref) => (
                    <Badge key={pref}>{pref}</Badge>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No preferences added yet</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Social Activity Section - Only show if own profile or connected */}
        {(isOwnProfile || connectionStatus === 'connected') && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{isOwnProfile ? "My Activity" : "Activity"}</CardTitle>
              <CardDescription>
                {isOwnProfile ? "Your posts, groups, and travel history" : `${profile.full_name}'s activity`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="posts" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="posts" className="gap-2">
                    <FileText className="h-4 w-4" />
                    Posts ({userPosts.length})
                  </TabsTrigger>
                  <TabsTrigger value="groups" className="gap-2">
                    <UsersIcon className="h-4 w-4" />
                    Groups ({userGroups.length})
                  </TabsTrigger>
                  <TabsTrigger value="bookings" className="gap-2">
                    <Ticket className="h-4 w-4" />
                    Travel History ({userBookings.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="posts" className="space-y-4 mt-4">
                  {userPosts.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-muted-foreground">No posts yet</p>
                    </div>
                  ) : (
                    userPosts.map((post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        currentUserId={currentUserId}
                        userLiked={userLikes.has(post.id)}
                        userSaved={userSaves.has(post.id)}
                        onUpdate={handlePostUpdate}
                      />
                    ))
                  )}
                </TabsContent>

                <TabsContent value="groups" className="space-y-4 mt-4">
                  {userGroups.length === 0 ? (
                    <div className="text-center py-8">
                      <UsersIcon className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-muted-foreground">No travel groups created yet</p>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                      {userGroups.map((group) => (
                        <TravelGroupCard
                          key={group.id}
                          group={group}
                          currentUserId={currentUserId}
                          isMember={userGroupMemberships.has(group.id)}
                          onUpdate={handleGroupUpdate}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="bookings" className="space-y-4 mt-4">
                  {userBookings.length === 0 ? (
                    <div className="text-center py-8">
                      <Ticket className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-muted-foreground">No travel history yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {userBookings.map((booking) => (
                        <Card key={booking.id}>
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <CardTitle className="text-base">
                                  {booking.from_location} → {booking.to_location}
                                </CardTitle>
                                <CardDescription className="capitalize">
                                  {booking.booking_type} • {booking.service_name}
                                </CardDescription>
                              </div>
                              <Badge variant={booking.status === "confirmed" ? "default" : "secondary"}>
                                {booking.status}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span>
                                {new Date(booking.departure_date).toLocaleDateString()} at{" "}
                                {booking.departure_time}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span>{booking.passenger_name}</span>
                            </div>
                            <div className="font-semibold text-primary">
                              ₹{parseFloat(booking.price_inr).toLocaleString("en-IN")}
                            </div>
                            {booking.booking_reference && (
                              <div className="text-xs text-muted-foreground">
                                Ref: {booking.booking_reference}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* App Review Section - Only for own profile */}
        {isOwnProfile && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Share Your Experience</CardTitle>
              <CardDescription>
                Travexa is currently in the development stage. Help us improve by sharing your feedback. Your review is private and will only be seen by our team. Would you use Travexa if it were fully functional?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>How would you rate your experience? *</Label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`h-8 w-8 ${
                          star <= (hoveredRating || rating)
                            ? "fill-accent text-accent"
                            : "text-muted-foreground"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reviewText">Your Review *</Label>
                <Textarea
                  id="reviewText"
                  placeholder="Tell us about your experience with Travexa... What do you like? What could be improved?"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  rows={5}
                  maxLength={1000}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {reviewText.length}/1000 characters
                </p>
              </div>

              <Button
                onClick={handleSubmitReview}
                disabled={isSubmittingReview || rating === 0 || reviewText.length < 10}
                className="w-full"
              >
                {isSubmittingReview ? "Submitting..." : "Submit Review"}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Your review is confidential and will only be viewed by the Travexa team to improve the app.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Profile;