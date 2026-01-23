import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Image as ImageIcon, 
  Check, 
  AlertCircle, 
  Globe, 
  ShoppingBag,
  RefreshCw,
  ExternalLink,
  MessageCircle
} from "lucide-react";
import { ImageUploadCard } from "./ImageUploadCard";
import { useWebsiteImages } from "@/hooks/useWebsiteImage";
import { WEBSITE_IMAGE_CONFIGS, WebsiteImageConfig } from "@/config/websiteImages";

interface ImageGroup {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  configs: WebsiteImageConfig[];
}

export function ImagesSettingsTab() {
  const { images, isLoading, refetch } = useWebsiteImages();
  const [activeGroup, setActiveGroup] = useState("homepage");

  const getImageUrl = (locationKey: string) => {
    return images.find(img => img.location_key === locationKey)?.image_url;
  };

  // Group images by page/section
  const imageGroups: ImageGroup[] = [
    {
      id: "homepage",
      label: "Homepage",
      icon: <Globe className="h-4 w-4" />,
      description: "Images displayed on the main landing page",
      configs: WEBSITE_IMAGE_CONFIGS.filter(c => c.usedIn.includes("LandingPage")),
    },
    {
      id: "pendant",
      label: "Pendant Page",
      icon: <ShoppingBag className="h-4 w-4" />,
      description: "Images displayed on the product/pendant page",
      configs: WEBSITE_IMAGE_CONFIGS.filter(c => c.usedIn.includes("PendantPage")),
    },
    {
      id: "chatwidget",
      label: "Chat Widget",
      icon: <MessageCircle className="h-4 w-4" />,
      description: "Images used in the AI chat assistant",
      configs: WEBSITE_IMAGE_CONFIGS.filter(c => c.usedIn.includes("ChatWidget")),
    },
  ];

  // Calculate stats
  const totalImages = WEBSITE_IMAGE_CONFIGS.length;
  const uploadedImages = WEBSITE_IMAGE_CONFIGS.filter(c => getImageUrl(c.locationKey)).length;
  const missingImages = totalImages - uploadedImages;

  return (
    <TabsContent value="images">
      <div className="space-y-6">
        {/* Header Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <ImageIcon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Website Images</CardTitle>
                  <CardDescription className="mt-1">
                    Manage images displayed on public pages. Changes take effect immediately.
                  </CardDescription>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => refetch()}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Stats Row */}
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-muted">
                  <ImageIcon className="h-3 w-3 mr-1" />
                  {totalImages} Total Locations
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                {uploadedImages > 0 && (
                  <Badge className="bg-status-active/10 text-status-active border-status-active/20">
                    <Check className="h-3 w-3 mr-1" />
                    {uploadedImages} Uploaded
                  </Badge>
                )}
              </div>
              {missingImages > 0 && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {missingImages} Using Default
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Image Groups Tabs */}
        <Tabs value={activeGroup} onValueChange={setActiveGroup}>
          <TabsList className="grid w-full grid-cols-3">
            {imageGroups.map(group => {
              const uploadedCount = group.configs.filter(c => getImageUrl(c.locationKey)).length;
              const totalCount = group.configs.length;
              
              return (
                <TabsTrigger key={group.id} value={group.id} className="flex items-center gap-2">
                  {group.icon}
                  <span>{group.label}</span>
                  <Badge 
                    variant="secondary" 
                    className={`ml-1 text-xs ${
                      uploadedCount === totalCount 
                        ? 'bg-status-active/10 text-status-active' 
                        : 'bg-muted'
                    }`}
                  >
                    {uploadedCount}/{totalCount}
                  </Badge>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {imageGroups.map(group => (
            <TabsContent key={group.id} value={group.id} className="mt-6">
              <div className="space-y-4">
                {/* Group Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">{group.label} Images</h3>
                    <p className="text-sm text-muted-foreground">{group.description}</p>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <a 
                      href={group.id === "homepage" ? "/" : "/pendant"} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Preview Page
                    </a>
                  </Button>
                </div>

                {/* Image Cards Grid */}
                <div className="grid gap-6 md:grid-cols-2">
                  {group.configs.map((config) => {
                    const currentUrl = getImageUrl(config.locationKey);
                    const hasCustomImage = !!currentUrl;
                    
                    return (
                      <div key={config.locationKey} className="relative">
                        {/* Status indicator */}
                        {!hasCustomImage && (
                          <div className="absolute -top-2 -right-2 z-10">
                            <Badge className="bg-amber-500 text-white shadow-sm">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Needs Upload
                            </Badge>
                          </div>
                        )}
                        <ImageUploadCard
                          locationKey={config.locationKey}
                          title={config.title}
                          description={config.description}
                          currentImageUrl={currentUrl}
                          defaultImageUrl={config.defaultAsset}
                          onImageUpdated={refetch}
                          aspectRatio={config.aspectRatio}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Help Card */}
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-muted rounded-lg">
                <AlertCircle className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <h4 className="font-medium">Image Upload Tips</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Use high-quality images (JPG, PNG, or WebP format)</li>
                  <li>Maximum file size: 5MB per image</li>
                  <li>Follow the recommended dimensions for each location</li>
                  <li>Changes appear immediately on the public website</li>
                  <li>Use the "Reset to Default" button to restore bundled images</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TabsContent>
  );
}
