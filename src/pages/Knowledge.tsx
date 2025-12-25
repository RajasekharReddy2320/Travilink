import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DashboardNav from "@/components/DashboardNav";
import { ArticleEditor } from "@/components/ArticleEditor";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Plus, Edit, Eye } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Article {
  id: string;
  title: string;
  content: string;
  cover_image: string | null;
  tags: string[] | null;
  is_published: boolean;
  created_at: string;
}

const Knowledge = () => {
  const [showEditor, setShowEditor] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setArticles(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Knowledge Base</h1>
            <p className="text-muted-foreground">Write and share your travel stories and tips</p>
          </div>
          <Button onClick={() => setShowEditor(!showEditor)}>
            {showEditor ? (
              <>
                <Eye className="h-4 w-4 mr-2" />
                View Articles
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                New Article
              </>
            )}
          </Button>
        </div>

        {showEditor ? (
          <ArticleEditor onSave={() => {
            loadArticles();
            setShowEditor(false);
          }} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <BookOpen className="h-16 w-16 mb-4 text-muted-foreground opacity-50" />
                  <h3 className="font-semibold mb-2">Start Writing</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Share your travel knowledge, tips, and experiences
                  </p>
                  <Button onClick={() => setShowEditor(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Write Your First Article
                  </Button>
                </CardContent>
              </Card>
            ) : (
              articles.map((article) => (
                <Card key={article.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  {article.cover_image && (
                    <img src={article.cover_image} alt={article.title} className="w-full h-48 object-cover" />
                  )}
                  <CardHeader>
                    <CardTitle className="line-clamp-2">{article.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none line-clamp-3 mb-4">
                      <ReactMarkdown>{article.content}</ReactMarkdown>
                    </div>
                    {article.tags && article.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {article.tags.slice(0, 3).map((tag, idx) => (
                          <span key={idx} className="text-xs px-2 py-1 bg-secondary rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Knowledge;
