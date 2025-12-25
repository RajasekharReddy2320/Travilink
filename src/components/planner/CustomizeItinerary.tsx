import { useState } from "react";
import { GripVertical, Trash2, Plus, Save, X, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ItineraryStep } from "@/types/tripPlanner";

interface CustomizeItineraryProps {
  steps: ItineraryStep[];
  onSave: (steps: ItineraryStep[]) => void;
  onCancel: () => void;
}

export default function CustomizeItinerary({ steps, onSave, onCancel }: CustomizeItineraryProps) {
  const [editableSteps, setEditableSteps] = useState<ItineraryStep[]>([...steps]);
  const [editingStep, setEditingStep] = useState<ItineraryStep | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newStep, setNewStep] = useState({
    title: "",
    description: "",
    location: "",
    time: "",
    estimatedCost: 0,
    category: "activity" as const
  });

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("dragIndex", index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData("dragIndex"));
    if (dragIndex === dropIndex) return;

    const newSteps = [...editableSteps];
    const [removed] = newSteps.splice(dragIndex, 1);
    newSteps.splice(dropIndex, 0, removed);
    setEditableSteps(newSteps);
  };

  const handleDelete = (index: number) => {
    setEditableSteps(editableSteps.filter((_, i) => i !== index));
  };

  const handleEditSave = () => {
    if (!editingStep) return;
    setEditableSteps(editableSteps.map(s => s.id === editingStep.id ? editingStep : s));
    setEditingStep(null);
  };

  const handleAddStep = () => {
    const step: ItineraryStep = {
      id: `custom-${Date.now()}`,
      day: editableSteps.length > 0 ? editableSteps[editableSteps.length - 1].day : 1,
      duration: "1h",
      isBookable: false,
      ...newStep
    };
    setEditableSteps([...editableSteps, step]);
    setAddDialogOpen(false);
    setNewStep({ title: "", description: "", location: "", time: "", estimatedCost: 0, category: "activity" });
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'transport': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'accommodation': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'food': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default: return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    }
  };

  return (
    <div className="space-y-4">
      <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-2">
        {editableSteps.map((step, index) => (
          <Card
            key={step.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
            className="cursor-move border-2 hover:border-primary/50 transition-colors"
          >
            <CardContent className="p-4 flex items-center gap-4">
              <GripVertical className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs">Day {step.day}</Badge>
                  <Badge className={`text-xs ${getCategoryColor(step.category)}`}>{step.category}</Badge>
                </div>
                <p className="font-medium truncate">{step.title}</p>
                <p className="text-sm text-muted-foreground truncate">{step.location}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm font-semibold text-primary">₹{step.estimatedCost?.toLocaleString('en-IN') || 0}</span>
                <Button variant="ghost" size="icon" onClick={() => setEditingStep(step)}>
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(index)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-between pt-4 border-t">
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline"><Plus className="mr-2 h-4 w-4" /> Add Activity</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Activity</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input value={newStep.title} onChange={(e) => setNewStep({...newStep, title: e.target.value})} placeholder="Activity name" />
              </div>
              <div>
                <Label>Location</Label>
                <Input value={newStep.location} onChange={(e) => setNewStep({...newStep, location: e.target.value})} placeholder="Location" />
              </div>
              <div>
                <Label>Time</Label>
                <Input value={newStep.time} onChange={(e) => setNewStep({...newStep, time: e.target.value})} placeholder="e.g., 10:00 AM" />
              </div>
              <div>
                <Label>Estimated Cost (₹)</Label>
                <Input type="number" value={newStep.estimatedCost} onChange={(e) => setNewStep({...newStep, estimatedCost: parseFloat(e.target.value) || 0})} />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={newStep.description} onChange={(e) => setNewStep({...newStep, description: e.target.value})} placeholder="Brief description" />
              </div>
              <Button onClick={handleAddStep} className="w-full" disabled={!newStep.title}>
                Add Activity
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}><X className="mr-2 h-4 w-4" /> Cancel</Button>
          <Button onClick={() => onSave(editableSteps)}><Save className="mr-2 h-4 w-4" /> Save Changes</Button>
        </div>
      </div>

      {/* Edit Step Dialog */}
      <Dialog open={!!editingStep} onOpenChange={(open) => !open && setEditingStep(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Activity</DialogTitle>
          </DialogHeader>
          {editingStep && (
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input value={editingStep.title} onChange={(e) => setEditingStep({...editingStep, title: e.target.value})} />
              </div>
              <div>
                <Label>Location</Label>
                <Input value={editingStep.location} onChange={(e) => setEditingStep({...editingStep, location: e.target.value})} />
              </div>
              <div>
                <Label>Time</Label>
                <Input value={editingStep.time} onChange={(e) => setEditingStep({...editingStep, time: e.target.value})} />
              </div>
              <div>
                <Label>Estimated Cost (₹)</Label>
                <Input type="number" value={editingStep.estimatedCost || 0} onChange={(e) => setEditingStep({...editingStep, estimatedCost: parseFloat(e.target.value) || 0})} />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={editingStep.description} onChange={(e) => setEditingStep({...editingStep, description: e.target.value})} />
              </div>
              <Button onClick={handleEditSave} className="w-full">Save Changes</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
