import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { usePublishedPosts } from "@/hooks/usePublishedPosts";
import { PublishedOverviewCard } from "./PublishedOverviewCard";
import { PublishedPostCard } from "./PublishedPostCard";

export function PublishedPostsSection() {
  const { t } = useTranslation();
  const {
    posts,
    isLoading,
    aggregatedMetrics,
    refreshMetrics,
    refreshAllMetrics,
    isRefreshing,
    isRefreshingAll,
    needsAutoRefresh,
  } = usePublishedPosts();

  const [refreshingPostId, setRefreshingPostId] = useState<string | null>(null);
  const [hasAutoRefreshed, setHasAutoRefreshed] = useState(false);

  // Auto-refresh if metrics are stale (only once per component mount)
  useEffect(() => {
    if (!hasAutoRefreshed && !isLoading && needsAutoRefresh()) {
      setHasAutoRefreshed(true);
      refreshAllMetrics();
    }
  }, [isLoading, needsAutoRefresh, hasAutoRefreshed, refreshAllMetrics]);

  const handleRefreshSingle = async (postId: string) => {
    setRefreshingPostId(postId);
    try {
      await refreshMetrics(postId);
    } finally {
      setRefreshingPostId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>{t("mediaManager.published.empty")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <PublishedOverviewCard
        metrics={aggregatedMetrics}
        onRefreshAll={refreshAllMetrics}
        isRefreshing={isRefreshingAll}
      />

      {/* Posts Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {posts.map((post) => (
          <PublishedPostCard
            key={post.id}
            post={post}
            onRefresh={handleRefreshSingle}
            isRefreshing={refreshingPostId === post.id || isRefreshing}
          />
        ))}
      </div>
    </div>
  );
}
