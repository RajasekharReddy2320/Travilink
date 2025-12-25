import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload, Save, Eye } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface ArticleEditorProps {
  onSave?: () => void;
}

export const ArticleEditor = ({ onSave }: ArticleEditorProps) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [tags, setTags] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCoverImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setCoverImageUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadCoverImage = async (userId: string): Promise<string | null> => {
    if (!coverImage) return null;

    const fileExt = coverImage.name.split(".").pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("article-images")
      .upload(fileName, coverImage);

    if (uploadError) {
      console.error("Error uploading image:", uploadError);
      return null;
    }

    const { data } = supabase.storage
      .from("article-images")
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const handleSave = async () => {
    try {
      setIsUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to create articles",
          variant: "destructive",
        });
        return;
      }

      let imageUrl = null;
      if (coverImage) {
        imageUrl = await uploadCoverImage(user.id);
      }

      const tagsArray = tags.split(",").map(tag => tag.trim()).filter(Boolean);

      const { error } = await supabase.from("articles").insert({
        user_id: user.id,
        title,
        content,
        cover_image: imageUrl,
        tags: tagsArray,
        is_published: isPublished,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Article saved successfully",
      });

      // Reset form
      setTitle("");
      setContent("");
      setCoverImage(null);
      setCoverImageUrl("");
      setTags("");
      setIsPublished(false);
      
      if (onSave) onSave();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Write Article</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            placeholder="Enter article title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cover-image">Cover Image</Label>
          <div className="flex items-center gap-2">
            <Input
              id="cover-image"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="flex-1"
            />
            <Button variant="outline" size="icon" disabled>
              <Upload className="h-4 w-4" />
            </Button>
          </div>
          {coverImageUrl && (
            <img
              src={coverImageUrl}
              alt="Cover preview"
              className="mt-2 h-32 w-full object-cover rounded-md"
            />
          )}
        </div>

        <div className="space-y-2">
          <Label>Content (Markdown supported)</Label>
          <Tabs defaultValue="write" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="write">
                <Save className="h-4 w-4 mr-2" />
                Write
              </TabsTrigger>
              <TabsTrigger value="preview">
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </TabsTrigger>
            </TabsList>
            <TabsContent value="write">
              <Textarea
                placeholder="Write your article content in Markdown...

Examples:
# Heading 1
## Heading 2
**bold text**
*italic text*
- bullet point
1. numbered list
[link text](url)
![image alt](image-url)"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[300px] font-mono"
              />
            </TabsContent>
            <TabsContent value="preview">
              <div className="min-h-[300px] p-4 border rounded-md prose prose-sm max-w-none">
                <ReactMarkdown>{content || "*Nothing to preview yet*"}</ReactMarkdown>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tags">Tags (comma separated)</Label>
          <Input
            id="tags"
            placeholder="travel, tips, adventure, etc."
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Switch
              id="publish"
              checked={isPublished}
              onCheckedChange={setIsPublished}
            />
            <Label htmlFor="publish">Publish article</Label>
          </div>

          <Button onClick={handleSave} disabled={!title || !content || isUploading}>
            {isUploading ? "Saving..." : "Save Article"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
