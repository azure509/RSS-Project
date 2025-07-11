import { Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useState } from "react";
import { 
  Home, 
  List, 
  Star, 
  Rss, 
  Users, 
  Plus, 
  Settings,
  LogOut,
  MoreVertical,
  Trash2 
} from "lucide-react";

interface Feed {
  id: number;
  title: string;
  url: string;
  active: boolean;
}

interface Collection {
  id: number;
  name: string;
  memberCount?: number;
}

export function Sidebar({ onAddFeed, onCreateCollection }: { 
  onAddFeed: () => void; 
  onCreateCollection: () => void; 
}) {
  const [location] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [feedToDelete, setFeedToDelete] = useState<Feed | null>(null);

  const { data: feeds = [] } = useQuery<Feed[]>({
    queryKey: ["/api/feeds"],
  });

  const { data: collections = [] } = useQuery<Collection[]>({
    queryKey: ["/api/collections"],
  });

  const deleteFeedMutation = useMutation({
    mutationFn: async (feedId: number) => {
      await apiRequest("DELETE", `/api/feeds/${feedId}`);
    },
    onSuccess: () => {
      toast({
        title: "Feed deleted",
        description: "RSS feed has been successfully deleted.",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/feeds"] });
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      setFeedToDelete(null);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      
      toast({
        title: "Error",
        description: error.message || "Failed to delete RSS feed. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteFeed = (feed: Feed) => {
    setFeedToDelete(feed);
  };

  const confirmDelete = () => {
    if (feedToDelete) {
      deleteFeedMutation.mutate(feedToDelete.id);
    }
  };

  const isActive = (path: string) => location === path;

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col">
      {/* Logo and Brand */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Rss className="text-primary-foreground text-sm" size={16} />
          </div>
          <h1 className="text-xl font-bold text-foreground">SUPRSS</h1>
        </div>
      </div>

      <ScrollArea className="flex-1">
        {/* Navigation Menu */}
        <nav className="p-4 space-y-2">
          <Link href="/">
            <Button
              variant={isActive("/") ? "secondary" : "ghost"}
              className="w-full justify-start"
            >
              <Home className="mr-3 h-4 w-4" />
              Dashboard
            </Button>
          </Link>
          
          <Link href="/articles">
            <Button
              variant={isActive("/articles") ? "secondary" : "ghost"}
              className="w-full justify-start"
            >
              <List className="mr-3 h-4 w-4" />
              All Articles
              <Badge variant="secondary" className="ml-auto">42</Badge>
            </Button>
          </Link>

          <Link href="/favorites">
            <Button
              variant={isActive("/favorites") ? "secondary" : "ghost"}
              className="w-full justify-start"
            >
              <Star className="mr-3 h-4 w-4" />
              Favorites
              <Badge variant="secondary" className="ml-auto">8</Badge>
            </Button>
          </Link>

          {/* My Feeds Section */}
          <div className="pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                My Feeds
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={onAddFeed}
                className="h-6 w-6 p-0"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            
            <div className="space-y-1">
              {feeds.map((feed) => (
                <div key={feed.id} className="flex items-center group">
                  <Link href={`/feeds/${feed.id}`} className="flex-1">
                    <Button
                      variant={isActive(`/feeds/${feed.id}`) ? "secondary" : "ghost"}
                      className="w-full justify-start text-sm"
                    >
                      <div className={`w-3 h-3 rounded-full mr-3 ${feed.active ? 'bg-green-500' : 'bg-gray-400'}`} />
                      <span className="truncate">{feed.title}</span>
                      <Badge variant="secondary" className="ml-auto text-xs">12</Badge>
                    </Button>
                  </Link>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDeleteFeed(feed)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Feed
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          </div>

          {/* Collections Section */}
          <div className="pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Collections
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={onCreateCollection}
                className="h-6 w-6 p-0"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            
            <div className="space-y-1">
              {collections.map((collection) => (
                <Link key={collection.id} href={`/collections/${collection.id}`}>
                  <Button
                    variant={isActive(`/collections/${collection.id}`) ? "secondary" : "ghost"}
                    className="w-full justify-start text-sm"
                  >
                    <Users className="mr-3 h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{collection.name}</span>
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {collection.memberCount || 0}
                    </Badge>
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        </nav>
      </ScrollArea>

      {/* User Profile */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.profileImageUrl || ""} alt={user?.firstName || ""} />
            <AvatarFallback>
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email}
            </p>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
        
        <Button
          variant="ghost"
          className="w-full mt-3 justify-start text-muted-foreground"
          onClick={() => window.location.href = "/api/logout"}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!feedToDelete} onOpenChange={() => setFeedToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete RSS Feed</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{feedToDelete?.title}"? This action cannot be undone and will remove all articles from this feed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteFeedMutation.isPending}
            >
              {deleteFeedMutation.isPending ? "Deleting..." : "Delete Feed"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </aside>
  );
}
