import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DashboardNav from "@/components/DashboardNav";
import { ArticleEditor } from "@/components/ArticleEditor";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Plus, Edit, Eye, Sparkles, Calendar, Tag, ArrowLeft, PenLine, Heart, Bookmark, Share2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

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
  const navigate = useNavigate();
  const [showEditor, setShowEditor] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
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

  if (selectedArticle) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardNav />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Button variant="ghost" onClick={() => setSelectedArticle(null)} className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Journals
          </Button>
          
          {selectedArticle.cover_image && (
            <div className="relative w-full h-64 md:h-96 rounded-2xl overflow-hidden mb-8">
              <img 
                src={selectedArticle.cover_image} 
                alt={selectedArticle.title} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
            </div>
          )}
          
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">{selectedArticle.title}</h1>
              <div className="flex items-center gap-4 text-muted-foreground text-sm">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDistanceToNow(new Date(selectedArticle.created_at), { addSuffix: true })}
                </span>
                {selectedArticle.is_published && (
                  <Badge variant="secondary" className="bg-green-500/10 text-green-600">Published</Badge>
                )}
              </div>
            </div>
            
            {selectedArticle.tags && selectedArticle.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedArticle.tags.map((tag, idx) => (
                  <Badge key={idx} variant="outline" className="rounded-full">
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
            
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <ReactMarkdown>{selectedArticle.content}</ReactMarkdown>
            </div>
            
            <div className="flex items-center justify-center gap-4 pt-8 border-t">
              <Button variant="ghost" size="lg">
                <Heart className="h-5 w-5 mr-2" />
                Like
              </Button>
              <Button variant="ghost" size="lg">
                <Bookmark className="h-5 w-5 mr-2" />
                Save
              </Button>
              <Button variant="ghost" size="lg">
                <Share2 className="h-5 w-5 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-violet-500/10" />
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-violet-500/15 rounded-full blur-3xl" />
        </div>
        
        <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-24">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6">
                <Sparkles className="h-4 w-4" />
                Your Travel Journal
              </div>
              <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent">
                Knowledge Base
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-xl mb-8">
                Capture your travel stories, share experiences, and create beautiful journals that inspire others.
              </p>
              <Button 
                size="lg" 
                onClick={() => setShowEditor(!showEditor)}
                className="px-8 py-6 text-lg bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
              >
                {showEditor ? (
                  <>
                    <Eye className="h-5 w-5 mr-2" />
                    View Journals
                  </>
                ) : (
                  <>
                    <PenLine className="h-5 w-5 mr-2" />
                    Write New Journal
                  </>
                )}
              </Button>
            </div>
            
            <div className="flex-1 flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-3xl blur-2xl opacity-30 scale-110" />
                <div className="relative w-64 h-80 md:w-80 md:h-96 bg-card rounded-3xl shadow-2xl border overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />
                  <div className="p-6 h-full flex flex-col">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    <div className="space-y-3 flex-1">
                      <div className="h-4 w-3/4 bg-muted rounded" />
                      <div className="h-4 w-full bg-muted rounded" />
                      <div className="h-4 w-2/3 bg-muted rounded" />
                      <div className="h-20 w-full bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg mt-4" />
                      <div className="h-4 w-full bg-muted rounded" />
                      <div className="h-4 w-5/6 bg-muted rounded" />
                    </div>
                    <div className="flex gap-2">
                      <Badge className="bg-primary/10 text-primary border-0">Travel</Badge>
                      <Badge className="bg-accent/10 text-accent border-0">Adventure</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        {showEditor ? (
          <div className="animate-fade-in">
            <ArticleEditor onSave={() => {
              loadArticles();
              setShowEditor(false);
            }} />
          </div>
        ) : (
          <>
            {articles.length === 0 ? (
              <div className="text-center py-20">
                <div className="relative inline-block mb-8">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-full blur-2xl opacity-30 scale-150" />
                  <div className="relative p-8 bg-card rounded-full border shadow-xl">
                    <BookOpen className="h-16 w-16 text-primary" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-3">Start Your Journey</h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-8">
                  Your travel journal awaits. Document your adventures, share tips, and inspire fellow travelers.
                </p>
                <Button size="lg" onClick={() => setShowEditor(true)} className="px-8">
                  <Edit className="h-5 w-5 mr-2" />
                  Write Your First Story
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {articles.map((article, index) => (
                  <Card 
                    key={article.id} 
                    className="group overflow-hidden hover:shadow-2xl transition-all duration-300 border-0 bg-card/50 backdrop-blur cursor-pointer hover:scale-[1.02]"
                    onClick={() => setSelectedArticle(article)}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="relative h-48 overflow-hidden">
                      {article.cover_image ? (
                        <img 
                          src={article.cover_image} 
                          alt={article.title} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 via-accent/10 to-secondary/20 flex items-center justify-center">
                          <BookOpen className="h-12 w-12 text-primary/50" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60" />
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="flex gap-2 flex-wrap">
                          {article.tags?.slice(0, 2).map((tag, idx) => (
                            <Badge key={idx} variant="secondary" className="bg-background/80 backdrop-blur text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xl line-clamp-2 group-hover:text-primary transition-colors">
                        {article.title}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDistanceToNow(new Date(article.created_at), { addSuffix: true })}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-sm dark:prose-invert max-w-none line-clamp-3 text-muted-foreground">
                        <ReactMarkdown>{article.content}</ReactMarkdown>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Knowledge;