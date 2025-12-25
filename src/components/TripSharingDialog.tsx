import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Share2, Mail, Trash2, Check, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

interface TripSharingDialogProps {
  tripGroupId: string;
}

interface TripShare {
  id: string;
  shared_with_email: string;
  access_level: string;
  status: string;
  created_at: string;
}

export default function TripSharingDialog({ tripGroupId }: TripSharingDialogProps) {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [accessLevel, setAccessLevel] = useState<"view" | "join">("view");
  const [shares, setShares] = useState<TripShare[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      fetchShares();
    }
  }, [open]);

  const fetchShares = async () => {
    try {
      const { data, error } = await supabase
        .from('trip_shares')
        .select('*')
        .eq('trip_group_id', tripGroupId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setShares(data || []);
    } catch (error: any) {
      console.error('Error fetching shares:', error);
    }
  };

  const handleShare = async () => {
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('trip_shares')
        .insert({
          trip_group_id: tripGroupId,
          owner_id: user.id,
          shared_with_email: email,
          access_level: accessLevel,
          status: 'pending',
        });

      if (error) throw error;

      toast({
        title: "Invitation sent",
        description: `Trip shared with ${email}`,
      });

      setEmail("");
      fetchShares();
    } catch (error: any) {
      console.error('Error sharing trip:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to share trip",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveShare = async (shareId: string) => {
    try {
      const { error } = await supabase
        .from('trip_shares')
        .delete()
        .eq('id', shareId);

      if (error) throw error;

      toast({
        title: "Share removed",
        description: "Trip share has been removed",
      });

      fetchShares();
    } catch (error: any) {
      console.error('Error removing share:', error);
      toast({
        title: "Error",
        description: "Failed to remove share",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return <Badge className="bg-green-500"><Check className="h-3 w-3 mr-1" />Accepted</Badge>;
      case 'declined':
        return <Badge className="bg-red-500"><X className="h-3 w-3 mr-1" />Declined</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Share2 className="h-4 w-4" />
          Share Trip
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Trip</DialogTitle>
          <DialogDescription>
            Invite friends and family to view or join your trip
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="flex gap-2">
              <Input
                id="email"
                type="email"
                placeholder="friend@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Access Level</Label>
            <RadioGroup value={accessLevel} onValueChange={(v) => setAccessLevel(v as "view" | "join")}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="view" id="view" />
                <Label htmlFor="view" className="font-normal cursor-pointer">
                  View Only - Can see trip details
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="join" id="join" />
                <Label htmlFor="join" className="font-normal cursor-pointer">
                  Join Trip - Can participate and book
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Button onClick={handleShare} disabled={loading} className="w-full">
            <Mail className="mr-2 h-4 w-4" />
            {loading ? "Sending..." : "Send Invitation"}
          </Button>

          {shares.length > 0 && (
            <div className="space-y-2 pt-4 border-t">
              <Label>Shared With</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {shares.map((share) => (
                  <div key={share.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{share.shared_with_email}</p>
                      <p className="text-xs text-muted-foreground capitalize">{share.access_level}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(share.status)}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleRemoveShare(share.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
