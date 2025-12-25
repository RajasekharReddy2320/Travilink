import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const CreateTravelGroupDialog = ({ onGroupCreated }: { onGroupCreated: () => void }) => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    title: "",
    from_location: "",
    to_location: "",
    travel_date: "",
    travel_mode: "",
    max_members: "10",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: newGroup, error } = await supabase
        .from("travel_groups")
        .insert({
          creator_id: user.id,
          title: formData.title,
          from_location: formData.from_location,
          to_location: formData.to_location,
          travel_date: formData.travel_date,
          travel_mode: formData.travel_mode,
          max_members: parseInt(formData.max_members),
          description: formData.description || null,
        })
        .select()
        .single();

      if (error) throw error;
      if (!newGroup) throw new Error("Failed to create group");

      // Auto-join the creator
      const { error: memberError } = await supabase
        .from("travel_group_members")
        .insert({
          group_id: newGroup.id,
          user_id: user.id,
          status: "accepted",
        });

      if (memberError) throw memberError;

      toast({ title: "Travel group created successfully!" });
      setFormData({
        title: "",
        from_location: "",
        to_location: "",
        travel_date: "",
        travel_mode: "",
        max_members: "10",
        description: "",
      });
      setOpen(false);
      onGroupCreated();
    } catch (error: any) {
      toast({
        title: "Error creating travel group",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2" variant="outline">
          <Users className="h-4 w-4" />
          Find Travel Buddies
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Create Travel Group</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Trip Title</Label>
            <Input
              id="title"
              placeholder="Weekend trip to Goa"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="from">From</Label>
              <Input
                id="from"
                placeholder="Mumbai"
                value={formData.from_location}
                onChange={(e) => setFormData({ ...formData, from_location: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="to">To</Label>
              <Input
                id="to"
                placeholder="Goa"
                value={formData.to_location}
                onChange={(e) => setFormData({ ...formData, to_location: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Travel Date
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.travel_date}
                onChange={(e) => setFormData({ ...formData, travel_date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mode">Travel Mode</Label>
              <Select
                value={formData.travel_mode}
                onValueChange={(value) => setFormData({ ...formData, travel_mode: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flight">Flight</SelectItem>
                  <SelectItem value="train">Train</SelectItem>
                  <SelectItem value="bus">Bus</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="max">Max Members</Label>
            <Input
              id="max"
              type="number"
              min="2"
              max="50"
              value={formData.max_members}
              onChange={(e) => setFormData({ ...formData, max_members: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Looking for travel companions..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Group"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};