import { useTranslation } from "react-i18next";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, RefreshCw, Heart, MessageCircle, Share2, Eye, Loader2, Clock, Image as ImageIcon } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { PublishedPostWithMetrics } from "@/hooks/usePublishedPosts";

interface PublishedPostCardProps {
  post: PublishedPostWithMetrics;
  onRefresh: (postId: string) => void;
  isRefreshing: boolean;
}

export function PublishedPostCard({ post, onRefresh, isRefreshing }: PublishedPostCardProps) {
  const { t } = useTranslation();

  const facebookUrl = post.facebook_post_id
    ? `https://facebook.com/${post.facebook_post_id}`
    : null;

  const formatNumber = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const metricsAge = post.metrics?.fetched_at
    ? formatDistanceToNow(new Date(post.metrics.fetched_at), { addSuffix: true })
    : null;

  return (
    <Card className="flex flex-col overflow-hidden">
      {/* Image or Placeholder */}
      <div className="relative aspect-video bg-muted">
        {post.image_url ? (
          <img
            src={post.image_url}
            alt={post.topic || "Post image"}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
          </div>
        )}
        {/* Language badge */}
        <Badge variant="secondary" className="absolute top-2 left-2">
          {t(`mediaManager.languages.${post.language}`)}
        </Badge>
      </div>

      <CardContent className="flex-1 p-4 space-y-3">
        {/* Topic */}
        <h3 className="font-semibold line-clamp-2">
          {post.topic || t("mediaManager.untitled")}
        </h3>

        {/* Published date */}
        <p className="text-sm text-muted-foreground flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {post.published_at
            ? format(new Date(post.published_at), "MMM d, yyyy 'at' HH:mm")
            : format(new Date(post.created_at), "MMM d, yyyy")}
        </p>

        {/* Engagement Metrics */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 text-sm">
            <Heart className="h-4 w-4 text-rose-500" />
            <span className="font-medium">
              {formatNumber(post.metrics?.reactions_total || 0)}
            </span>
            <span className="text-muted-foreground text-xs">
              {t("mediaManager.published.metrics.reactions")}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <MessageCircle className="h-4 w-4 text-blue-500" />
            <span className="font-medium">
              {formatNumber(post.metrics?.comments_count || 0)}
            </span>
            <span className="text-muted-foreground text-xs">
              {t("mediaManager.published.metrics.comments")}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Share2 className="h-4 w-4 text-green-500" />
            <span className="font-medium">
              {formatNumber(post.metrics?.shares_count || 0)}
            </span>
            <span className="text-muted-foreground text-xs">
              {t("mediaManager.published.metrics.shares")}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Eye className="h-4 w-4 text-amber-500" />
            <span className="font-medium">
              {formatNumber(post.metrics?.impressions || 0)}
            </span>
            <span className="text-muted-foreground text-xs">
              {t("mediaManager.published.metrics.reach")}
            </span>
          </div>
        </div>

        {/* Last updated */}
        {metricsAge && (
          <p className="text-xs text-muted-foreground">
            {t("mediaManager.published.lastUpdated")}: {metricsAge}
          </p>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-1"
          onClick={() => onRefresh(post.id)}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          {t("mediaManager.published.refresh")}
        </Button>
        {facebookUrl && (
          <Button
            variant="default"
            size="sm"
            className="flex-1 gap-1"
            onClick={() => window.open(facebookUrl, "_blank")}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {t("mediaManager.published.viewOnFacebook")}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
