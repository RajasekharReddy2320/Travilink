import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import DashboardNav from "@/components/DashboardNav";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Image, Upload, FolderPlus, Trash2, Loader2 } from "lucide-react";

interface Album {
  id: string;
  name: string;
  description: string | null;
}

interface Photo {
  id: string;
  file_path: string;
  caption: string | null;
  album_id: string | null;
  created_at: string;
}

const PhotoVault = () => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState("");
  const [newAlbumDescription, setNewAlbumDescription] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadAlbums();
    loadPhotos();
  }, []);

  const loadAlbums = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("photo_albums")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAlbums(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading albums",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const loadPhotos = async (albumId?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from("photos")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (albumId) {
        query = query.eq("album_id", albumId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPhotos(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading photos",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const createAlbum = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("photo_albums").insert({
        user_id: user.id,
        name: newAlbumName,
        description: newAlbumDescription,
      });

      if (error) throw error;

      toast({ title: "Album created successfully" });
      setNewAlbumName("");
      setNewAlbumDescription("");
      loadAlbums();
    } catch (error: any) {
      toast({
        title: "Error creating album",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const uploadPhotos = async (files: FileList) => {
    try {
      setUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      for (const file of Array.from(files)) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("travel-photos")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from("travel-photos")
          .getPublicUrl(fileName);

        await supabase.from("photos").insert({
          user_id: user.id,
          file_path: data.publicUrl,
          album_id: selectedAlbum,
        });
      }

      toast({ title: "Photos uploaded successfully" });
      loadPhotos(selectedAlbum || undefined);
    } catch (error: any) {
      toast({
        title: "Error uploading photos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const deletePhoto = async (photoId: string, filePath: string) => {
    try {
      const fileName = filePath.split("/").pop();
      if (fileName) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.storage
            .from("travel-photos")
            .remove([`${user.id}/${fileName}`]);
        }
      }

      const { error } = await supabase.from("photos").delete().eq("id", photoId);

      if (error) throw error;

      toast({ title: "Photo deleted successfully" });
      loadPhotos(selectedAlbum || undefined);
    } catch (error: any) {
      toast({
        title: "Error deleting photo",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Personal Photo Vault</h1>
          <p className="text-muted-foreground">Store and organize your travel memories</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Albums</CardTitle>
            </CardHeader>
            <CardContent>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full mb-4">
                    <FolderPlus className="h-4 w-4 mr-2" />
                    New Album
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Album</DialogTitle>
                    <DialogDescription>
                      Organize your photos into albums
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="album-name">Album Name</Label>
                      <Input
                        id="album-name"
                        value={newAlbumName}
                        onChange={(e) => setNewAlbumName(e.target.value)}
                        placeholder="e.g., Paris 2024"
                      />
                    </div>
                    <div>
                      <Label htmlFor="album-description">Description</Label>
                      <Input
                        id="album-description"
                        value={newAlbumDescription}
                        onChange={(e) => setNewAlbumDescription(e.target.value)}
                        placeholder="Optional description"
                      />
                    </div>
                    <Button onClick={createAlbum} disabled={!newAlbumName}>
                      Create Album
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <div className="space-y-2">
                <Button
                  variant={selectedAlbum === null ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => {
                    setSelectedAlbum(null);
                    loadPhotos();
                  }}
                >
                  All Photos
                </Button>
                {albums.map((album) => (
                  <Button
                    key={album.id}
                    variant={selectedAlbum === album.id ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => {
                      setSelectedAlbum(album.id);
                      loadPhotos(album.id);
                    }}
                  >
                    {album.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                {selectedAlbum
                  ? albums.find((a) => a.id === selectedAlbum)?.name
                  : "All Photos"}
              </CardTitle>
              <div>
                <Input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => e.target.files && uploadPhotos(e.target.files)}
                  className="hidden"
                  id="photo-upload"
                  disabled={uploading}
                />
                <Label htmlFor="photo-upload">
                  <Button asChild disabled={uploading}>
                    <span>
                      {uploading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4 mr-2" />
                      )}
                      Upload Photos
                    </span>
                  </Button>
                </Label>
              </div>
            </CardHeader>
            <CardContent>
              {photos.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Image className="h-20 w-20 mx-auto mb-4 opacity-50" />
                  <p className="mb-4">No photos yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {photos.map((photo) => (
                    <div key={photo.id} className="relative group">
                      <img
                        src={photo.file_path}
                        alt={photo.caption || "Photo"}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => deletePhoto(photo.id, photo.file_path)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PhotoVault;
