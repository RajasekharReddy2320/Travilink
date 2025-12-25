import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { PlusCircle, Upload, X, MapPin, Calendar, Plane } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const CreatePostDialog = ({ onPostCreated }: { onPostCreated: () => void }) => {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [includeItinerary, setIncludeItinerary] = useState(false);
  const [itinerary, setItinerary] = useState({
    destination: "",
    startDate: "",
    endDate: "",
    transportation: "",
    activities: "",
    estimatedBudget: ""
  });
  const { toast } = useToast();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "Image too large", description: "Please select an image under 5MB", variant: "destructive" });
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let imageUrl = null;

      // Upload image if selected
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('post-images')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('post-images')
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
      }

      const { error } = await supabase.from("posts").insert({
        user_id: user.id,
        content: content.trim(),
        image_url: imageUrl,
        itinerary: includeItinerary ? {
          destination: itinerary.destination,
          startDate: itinerary.startDate,
          endDate: itinerary.endDate,
          transportation: itinerary.transportation,
          activities: itinerary.activities.split(',').map(a => a.trim()),
          estimatedBudget: parseFloat(itinerary.estimatedBudget) || 0
        } : null,
      });

      if (error) throw error;

      toast({ title: "Post created successfully!" });
      setContent("");
      setImageFile(null);
      setImagePreview("");
      setIncludeItinerary(false);
      setItinerary({
        destination: "",
        startDate: "",
        endDate: "",
        transportation: "",
        activities: "",
        estimatedBudget: ""
      });
      setOpen(false);
      onPostCreated();
    } catch (error: any) {
      toast({
        title: "Error creating post",
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
        <Button className="gap-2">
          <PlusCircle className="h-4 w-4" />
          Create Post
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Create a New Post</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="content">What's on your mind?</Label>
            <Textarea
              id="content"
              placeholder="Share your travel experiences..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="image" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload Image (optional)
            </Label>
            <input
              id="image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById('image')?.click()}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              Choose Image
            </Button>
            {imagePreview && (
              <div className="relative">
                <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={removeImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeItinerary"
                checked={includeItinerary}
                onCheckedChange={(checked) => setIncludeItinerary(checked as boolean)}
              />
              <Label htmlFor="includeItinerary" className="flex items-center gap-2 cursor-pointer">
                <MapPin className="h-4 w-4" />
                Add Travel Itinerary (bookable by others)
              </Label>
            </div>
            
            {includeItinerary && (
              <div className="space-y-3 pl-6 border-l-2 border-primary/20">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="destination">Destination</Label>
                    <Input
                      id="destination"
                      placeholder="e.g., Paris, France"
                      value={itinerary.destination}
                      onChange={(e) => setItinerary({ ...itinerary, destination: e.target.value })}
                      required={includeItinerary}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="transportation">Transportation</Label>
                    <Input
                      id="transportation"
                      placeholder="e.g., Flight, Train"
                      value={itinerary.transportation}
                      onChange={(e) => setItinerary({ ...itinerary, transportation: e.target.value })}
                      required={includeItinerary}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={itinerary.startDate}
                      onChange={(e) => setItinerary({ ...itinerary, startDate: e.target.value })}
                      required={includeItinerary}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={itinerary.endDate}
                      onChange={(e) => setItinerary({ ...itinerary, endDate: e.target.value })}
                      required={includeItinerary}
                    />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="activities">Activities (comma-separated)</Label>
                  <Input
                    id="activities"
                    placeholder="e.g., Eiffel Tower, Louvre, Seine cruise"
                    value={itinerary.activities}
                    onChange={(e) => setItinerary({ ...itinerary, activities: e.target.value })}
                  />
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="estimatedBudget">Estimated Budget (₹)</Label>
                  <Input
                    id="estimatedBudget"
                    type="number"
                    placeholder="e.g., 50000"
                    value={itinerary.estimatedBudget}
                    onChange={(e) => setItinerary({ ...itinerary, estimatedBudget: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !content.trim()}>
              {isLoading ? "Posting..." : "Post"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};