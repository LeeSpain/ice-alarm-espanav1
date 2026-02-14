import { useState } from "react";
import { Lightbulb, Plus, Trash2, ChevronDown, ChevronRight, Bug, Sparkles, FileText, ListChecks } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdminIdeas, type AdminIdea } from "@/hooks/useAdminIdeas";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const CATEGORIES = [
  { value: "idea", label: "Idea", icon: Lightbulb, color: "bg-yellow-500/20 text-yellow-600 border-yellow-500/30" },
  { value: "feature", label: "Feature", icon: Sparkles, color: "bg-blue-500/20 text-blue-600 border-blue-500/30" },
  { value: "bug", label: "Bug", icon: Bug, color: "bg-red-500/20 text-red-600 border-red-500/30" },
  { value: "note", label: "Note", icon: FileText, color: "bg-muted text-muted-foreground border-border" },
] as const;

const PRIORITIES = [
  { value: "low", label: "Low", color: "bg-muted text-muted-foreground" },
  { value: "medium", label: "Medium", color: "bg-orange-500/20 text-orange-600" },
  { value: "high", label: "High", color: "bg-red-500/20 text-red-600" },
] as const;

interface IdeasNotepadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function IdeasNotepad({ open, onOpenChange }: IdeasNotepadProps) {
  const { ideas, createIdea, updateIdea, deleteIdea, isLoading } = useAdminIdeas();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<AdminIdea["category"]>("idea");
  const [priority, setPriority] = useState<AdminIdea["priority"]>("medium");
  const [isChecklist, setIsChecklist] = useState(false);
  const [filterTab, setFilterTab] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredIdeas = ideas.filter((i) => filterTab === "all" || i.category === filterTab);

  const handleAdd = () => {
    if (!title.trim()) return;
    createIdea.mutate(
      { title: title.trim(), content: content.trim(), category, priority, is_checklist: isChecklist },
      {
        onSuccess: () => {
          setTitle("");
          setContent("");
          setIsChecklist(false);
          toast.success("Added!");
        },
      }
    );
  };

  const toggleComplete = (idea: AdminIdea) => {
    updateIdea.mutate({ id: idea.id, completed: !idea.completed });
  };

  const handleDelete = (id: string) => {
    deleteIdea.mutate(id, { onSuccess: () => toast.success("Deleted") });
  };

  const getCategoryMeta = (cat: string) => CATEGORIES.find((c) => c.value === cat) || CATEGORIES[3];
  const getPriorityMeta = (p: string) => PRIORITIES.find((pr) => pr.value === p) || PRIORITIES[1];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-3">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Ideas & Notes
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Capture ideas, bugs, features and checklists for this app.
          </DialogDescription>
        </DialogHeader>

        {/* Add Form */}
        <div className="px-6 pb-3 space-y-2 border-b">
          <div className="flex gap-2">
            <Input
              placeholder="What's on your mind?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleAdd()}
              className="flex-1 h-9"
            />
            <Button size="sm" onClick={handleAdd} disabled={!title.trim() || createIdea.isPending}>
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>
          <Textarea
            placeholder="Details (optional)..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[60px] text-sm resize-none"
          />
          <div className="flex items-center gap-3 flex-wrap">
            <Select value={category} onValueChange={(v) => setCategory(v as AdminIdea["category"])}>
              <SelectTrigger className="w-[120px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    <span className="flex items-center gap-1.5">
                      <c.icon className="h-3 w-3" /> {c.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={priority} onValueChange={(v) => setPriority(v as AdminIdea["priority"])}>
              <SelectTrigger className="w-[110px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1.5 ml-auto">
              <Switch id="checklist-toggle" checked={isChecklist} onCheckedChange={setIsChecklist} />
              <Label htmlFor="checklist-toggle" className="text-xs flex items-center gap-1 cursor-pointer">
                <ListChecks className="h-3 w-3" /> Checklist
              </Label>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <Tabs value={filterTab} onValueChange={setFilterTab} className="px-6 pt-3">
          <TabsList className="h-8 w-full justify-start">
            <TabsTrigger value="all" className="text-xs px-3 h-7">All ({ideas.length})</TabsTrigger>
            {CATEGORIES.map((c) => {
              const count = ideas.filter((i) => i.category === c.value).length;
              return (
                <TabsTrigger key={c.value} value={c.value} className="text-xs px-3 h-7">
                  {c.label} {count > 0 && `(${count})`}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>

        {/* Ideas List */}
        <ScrollArea className="flex-1 px-6 py-3 min-h-0">
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>
          ) : filteredIdeas.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No items yet. Add your first idea above!</p>
          ) : (
            <div className="space-y-2">
              {filteredIdeas.map((idea) => {
                const catMeta = getCategoryMeta(idea.category);
                const priMeta = getPriorityMeta(idea.priority);
                const isExpanded = expandedId === idea.id;
                const CatIcon = catMeta.icon;

                return (
                  <div
                    key={idea.id}
                    className={cn(
                      "border rounded-lg p-3 transition-colors",
                      idea.completed && "opacity-60"
                    )}
                  >
                    <div className="flex items-start gap-2">
                      {idea.is_checklist && (
                        <Checkbox
                          checked={idea.completed}
                          onCheckedChange={() => toggleComplete(idea)}
                          className="mt-0.5"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : idea.id)}
                          className="flex items-center gap-1.5 w-full text-left"
                        >
                          {idea.content ? (
                            isExpanded ? <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                          ) : <span className="w-3" />}
                          <span className={cn("text-sm font-medium truncate", idea.completed && "line-through")}>
                            {idea.title}
                          </span>
                        </button>
                        {isExpanded && idea.content && (
                          <p className="text-xs text-muted-foreground mt-1.5 ml-[18px] whitespace-pre-wrap">
                            {idea.content}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", catMeta.color)}>
                          <CatIcon className="h-2.5 w-2.5 mr-0.5" />
                          {catMeta.label}
                        </Badge>
                        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", priMeta.color)}>
                          {priMeta.label}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(idea.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
