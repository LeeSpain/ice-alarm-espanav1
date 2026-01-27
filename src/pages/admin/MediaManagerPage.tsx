import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Save, Check, Send, Search, Sparkles, Image as ImageIcon, Play, Trash2, Edit } from "lucide-react";
import { format } from "date-fns";
import { useSocialPosts, useSocialPost, SocialPost, SocialPostStatus, CreateSocialPostData } from "@/hooks/useSocialPosts";
import { useSocialPostImages } from "@/hooks/useSocialPostImages";
import { useMediaDraft, MediaDraftOutput } from "@/hooks/useMediaDraft";
import { useBrandedImageGenerator } from "@/hooks/useBrandedImageGenerator";
import { checkPostCompliance, ComplianceWarning } from "@/lib/complianceChecker";
import { ComplianceWarningDialog } from "@/components/admin/media/ComplianceWarningDialog";
import { cn } from "@/lib/utils";
const GOALS = [
  { value: "brand_awareness", label: "Brand Awareness" },
  { value: "lead_generation", label: "Lead Generation" },
  { value: "engagement", label: "Engagement" },
  { value: "education", label: "Education" },
  { value: "promotion", label: "Promotion" },
];

const AUDIENCES = [
  { value: "expats_spain", label: "Expats in Spain" },
  { value: "elderly_care", label: "Elderly Care" },
  { value: "family_caregivers", label: "Family Caregivers" },
  { value: "healthcare_pros", label: "Healthcare Professionals" },
  { value: "general", label: "General Audience" },
];

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "both", label: "Both (EN + ES)" },
];

const STATUS_COLORS: Record<SocialPostStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  approved: "bg-status-active/10 text-status-active border-status-active/20",
  published: "bg-primary/10 text-primary border-primary/20",
  failed: "bg-destructive/10 text-destructive border-destructive/20",
};

export default function MediaManagerPage() {
  const { t } = useTranslation();
  const [statusFilter, setStatusFilter] = useState<SocialPostStatus | "all">("all");
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  
  // Form state
  const [goal, setGoal] = useState("");
  const [audience, setAudience] = useState("");
  const [topic, setTopic] = useState("");
  const [language, setLanguage] = useState<"en" | "es" | "both">("both");
  const [postText, setPostText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [aiOutput, setAiOutput] = useState<MediaDraftOutput | null>(null);
  const [complianceWarnings, setComplianceWarnings] = useState<ComplianceWarning[]>([]);
  const [showComplianceDialog, setShowComplianceDialog] = useState(false);

  const { posts, isLoading, createDraft, updateDraft, approvePost, publishPost, deletePost, isCreating, isUpdating, isApproving, isPublishing } = useSocialPosts(statusFilter);
  const { data: selectedPost } = useSocialPost(selectedPostId);
  const { uploadImage, isUploading } = useSocialPostImages();
  const { generateDraft, isGenerating } = useMediaDraft();
  const { generateImage: generateBrandedImage, isGenerating: isGeneratingImage } = useBrandedImageGenerator();

  // Load selected post into form
  const handleSelectPost = (post: SocialPost) => {
    setSelectedPostId(post.id);
    setGoal(post.goal || "");
    setAudience(post.target_audience || "");
    setTopic(post.topic || "");
    setLanguage(post.language);
    setPostText(post.post_text || "");
    setImageUrl(post.image_url || "");
  };

  const handleClearForm = () => {
    setSelectedPostId(null);
    setGoal("");
    setAudience("");
    setTopic("");
    setLanguage("both");
    setPostText("");
    setImageUrl("");
  };

  const handleSaveDraft = async () => {
    const data: CreateSocialPostData = {
      goal: goal || undefined,
      target_audience: audience || undefined,
      topic: topic || undefined,
      language,
      post_text: postText || undefined,
      image_url: imageUrl || undefined,
    };

    if (selectedPostId) {
      await updateDraft({ id: selectedPostId, data });
    } else {
      const newPost = await createDraft(data);
      setSelectedPostId(newPost.id);
    }
  };

  const handleApprove = async () => {
    if (!selectedPostId) return;
    
    // Check compliance before approving
    const result = checkPostCompliance(postText);
    
    if (!result.isCompliant) {
      // Show warning dialog
      setComplianceWarnings(result.warnings);
      setShowComplianceDialog(true);
      return;
    }
    
    // Compliant - proceed with approval
    await approvePost(selectedPostId);
  };

  const handleForceApprove = async () => {
    if (selectedPostId) {
      await approvePost(selectedPostId);
      setShowComplianceDialog(false);
      setComplianceWarnings([]);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadImage(file);
    if (url) setImageUrl(url);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this post?")) {
      await deletePost(id);
      if (selectedPostId === id) handleClearForm();
    }
  };

  // AI workflow handlers
  const handleResearch = async () => {
    const output = await generateDraft({
      topic,
      goal,
      target_audience: audience,
      language,
      post_id: selectedPostId || undefined,
      workflow_type: "research",
    });
    if (output) {
      setAiOutput(output);
    }
  };

  const handleWriteDraft = async () => {
    const output = await generateDraft({
      topic,
      goal,
      target_audience: audience,
      language,
      post_id: selectedPostId || undefined,
      workflow_type: "write",
    });
    if (output) {
      setAiOutput(output);
      // Apply the generated text based on language
      if (language === "en") {
        setPostText(output.post_en);
      } else if (language === "es") {
        setPostText(output.post_es);
      } else {
        setPostText(`🇬🇧 ENGLISH:\n${output.post_en}\n\n---\n\n🇪🇸 ESPAÑOL:\n${output.post_es}`);
      }
    }
  };

  const handleFullWorkflow = async () => {
    const output = await generateDraft({
      topic,
      goal,
      target_audience: audience,
      language,
      post_id: selectedPostId || undefined,
      workflow_type: "full",
    });
    if (output) {
      setAiOutput(output);
      // Apply the generated text based on language
      if (language === "en") {
        setPostText(output.post_en);
      } else if (language === "es") {
        setPostText(output.post_es);
      } else {
        setPostText(`🇬🇧 ENGLISH:\n${output.post_en}\n\n---\n\n🇪🇸 ESPAÑOL:\n${output.post_es}`);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("sidebar.mediaManager", "Media Manager")}</h1>
        <p className="text-muted-foreground">Create and manage social media posts for Facebook</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel - Create/Edit Draft */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{selectedPostId ? "Edit Draft" : "Create Draft"}</span>
              {selectedPostId && (
                <Button variant="ghost" size="sm" onClick={handleClearForm}>
                  New Draft
                </Button>
              )}
            </CardTitle>
            <CardDescription>Configure your post parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Goal</Label>
                <Select value={goal} onValueChange={setGoal}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select goal" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    {GOALS.map((g) => (
                      <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Target Audience</Label>
                <Select value={audience} onValueChange={setAudience}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select audience" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    {AUDIENCES.map((a) => (
                      <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Topic</Label>
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Summer safety tips for elderly expats"
              />
            </div>

            <div className="space-y-2">
              <Label>Language</Label>
              <Select value={language} onValueChange={(v) => setLanguage(v as "en" | "es" | "both")}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {LANGUAGES.map((l) => (
                    <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* AI Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button 
                variant="outline" 
                disabled={isGenerating || !topic}
                onClick={handleResearch}
                className="gap-2"
              >
                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Research
              </Button>
              <Button 
                variant="outline" 
                disabled={isGenerating || !topic}
                onClick={handleWriteDraft}
                className="gap-2"
              >
                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Write Draft
              </Button>
              <Button 
                variant="outline" 
                disabled={isGeneratingImage || !aiOutput?.image_text}
                onClick={async () => {
                  if (!aiOutput?.image_text) {
                    return;
                  }
                  const url = await generateBrandedImage({
                    imageText: {
                      headline: aiOutput.image_text.headline,
                      subheadline: aiOutput.image_text.subheadline,
                      cta: aiOutput.image_text.cta || "Learn More",
                    },
                  });
                  if (url) {
                    setImageUrl(url);
                  }
                }}
                className="gap-2"
                title={!aiOutput?.image_text ? "Run AI workflow first to get image text" : "Generate branded image"}
              >
                {isGeneratingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                Generate Image
              </Button>
              <Button 
                variant="outline" 
                disabled={isGenerating || !topic}
                onClick={handleFullWorkflow}
                className="gap-2"
              >
                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                Full Workflow
              </Button>
            </div>

            {/* AI Output Preview */}
            {aiOutput && (
              <div className="border rounded-lg p-3 bg-muted/50 space-y-2">
                <p className="text-xs font-medium text-muted-foreground">AI Research Summary</p>
                <p className="text-sm">{aiOutput.research.topic_insights}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {aiOutput.hashtags_en.slice(0, 5).map((tag, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
                  ))}
                </div>
                {aiOutput.image_text && (
                  <div className="mt-2 pt-2 border-t">
                    <p className="text-xs font-medium text-muted-foreground">Suggested Image Text</p>
                    <p className="text-sm font-semibold">{aiOutput.image_text.headline}</p>
                    <p className="text-xs text-muted-foreground">{aiOutput.image_text.subheadline}</p>
                  </div>
                )}
              </div>
            )}

            {!topic && (
              <p className="text-xs text-muted-foreground text-center">
                Enter a topic to enable AI features
              </p>
            )}
          </CardContent>
        </Card>

        {/* Right Panel - Draft Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Draft Preview</CardTitle>
            <CardDescription>Preview how your post will appear</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Post Text</Label>
              <Textarea
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                placeholder="Write your post content here..."
                rows={6}
              />
              <p className="text-xs text-muted-foreground text-right">
                {postText.length} / 63,206 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label>Image</Label>
              {imageUrl ? (
                <div className="relative aspect-video rounded-lg overflow-hidden border bg-muted">
                  <img src={imageUrl} alt="Post preview" className="w-full h-full object-cover" />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8"
                    onClick={() => setImageUrl("")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                    disabled={isUploading}
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    {isUploading ? (
                      <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin text-muted-foreground" />
                    ) : (
                      <ImageIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    )}
                    <p className="text-sm text-muted-foreground">
                      {isUploading ? "Uploading..." : "Click to upload image"}
                    </p>
                  </label>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleSaveDraft}
                disabled={isCreating || isUpdating}
                className="flex-1 gap-2"
              >
                {isCreating || isUpdating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Draft
              </Button>
              <Button
                onClick={handleApprove}
                disabled={!selectedPostId || isApproving || selectedPost?.status === "approved"}
                variant="secondary"
                className="gap-2"
              >
                {isApproving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Approve
              </Button>
              <Button
                onClick={async () => {
                  if (selectedPostId) {
                    await publishPost(selectedPostId);
                  }
                }}
                disabled={!selectedPostId || isPublishing || selectedPost?.status !== "approved"}
                variant="outline"
                className="gap-2"
                title={selectedPost?.status !== "approved" ? "Post must be approved first" : "Publish to Facebook"}
              >
                {isPublishing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Publish
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section - Drafts Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Existing Posts</CardTitle>
              <CardDescription>Manage your drafts and published posts</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as SocialPostStatus | "all")}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="draft">Drafts</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="published">Published</TabsTrigger>
              <TabsTrigger value="failed">Failed</TabsTrigger>
            </TabsList>

            <TabsContent value={statusFilter} className="mt-0">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No posts found. Create your first draft above!
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Topic</TableHead>
                        <TableHead>Goal</TableHead>
                        <TableHead>Language</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {posts.map((post) => (
                        <TableRow
                          key={post.id}
                          className={cn(
                            "cursor-pointer",
                            selectedPostId === post.id && "bg-muted/50"
                          )}
                          onClick={() => handleSelectPost(post)}
                        >
                          <TableCell className="font-medium max-w-[200px] truncate">
                            {post.topic || "Untitled"}
                          </TableCell>
                          <TableCell>
                            {GOALS.find((g) => g.value === post.goal)?.label || "-"}
                          </TableCell>
                          <TableCell>
                            {LANGUAGES.find((l) => l.value === post.language)?.label}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={STATUS_COLORS[post.status]}>
                              {post.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(post.created_at), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectPost(post);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(post.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Compliance Warning Dialog */}
      <ComplianceWarningDialog
        open={showComplianceDialog}
        onOpenChange={setShowComplianceDialog}
        warnings={complianceWarnings}
        onConfirm={handleForceApprove}
        isLoading={isApproving}
      />
    </div>
  );
}
