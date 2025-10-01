import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { X, Filter } from "lucide-react";

interface FilterState {
  courts: string[];
  categories: string[];
  yearRange: [number, number];
  minCitations: number;
  minInfluence: number;
}

interface FilterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

export const FilterModal = ({ open, onOpenChange, filters, onFiltersChange }: FilterModalProps) => {
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);

  const courts = [
    "Supreme Court",
    "Court of Appeals",
    "District Court",
    "State Supreme Court",
    "Federal Circuit"
  ];

  const categories = [
    "Constitutional",
    "Criminal",
    "Civil Rights",
    "Education",
    "Privacy Rights",
    "Employment",
    "Contract",
    "Tort",
    "Corporate"
  ];

  const handleCourtChange = (court: string, checked: boolean) => {
    const newCourts = checked 
      ? [...localFilters.courts, court]
      : localFilters.courts.filter(c => c !== court);
    
    setLocalFilters(prev => ({ ...prev, courts: newCourts }));
  };

  const handleCategoryChange = (category: string, checked: boolean) => {
    const newCategories = checked 
      ? [...localFilters.categories, category]
      : localFilters.categories.filter(c => c !== category);
    
    setLocalFilters(prev => ({ ...prev, categories: newCategories }));
  };

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
    onOpenChange(false);
  };

  const handleClearFilters = () => {
    const clearedFilters: FilterState = {
      courts: [],
      categories: [],
      yearRange: [1800, 2024],
      minCitations: 0,
      minInfluence: 0
    };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (localFilters.courts.length > 0) count++;
    if (localFilters.categories.length > 0) count++;
    if (localFilters.yearRange[0] > 1800 || localFilters.yearRange[1] < 2024) count++;
    if (localFilters.minCitations > 0) count++;
    if (localFilters.minInfluence > 0) count++;
    return count;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-legal-primary" />
            Filter Citation Network
            {getActiveFilterCount() > 0 && (
              <Badge variant="secondary" className="ml-2">
                {getActiveFilterCount()} active
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Refine your citation network visualization with these filters
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Courts */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Courts</Label>
            <div className="grid grid-cols-2 gap-2">
              {courts.map((court) => (
                <div key={court} className="flex items-center space-x-2">
                  <Checkbox
                    id={`court-${court}`}
                    checked={localFilters.courts.includes(court)}
                    onCheckedChange={(checked) => 
                      handleCourtChange(court, checked as boolean)
                    }
                  />
                  <Label htmlFor={`court-${court}`} className="text-sm">
                    {court}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Legal Categories</Label>
            <div className="grid grid-cols-3 gap-2">
              {categories.map((category) => (
                <div key={category} className="flex items-center space-x-2">
                  <Checkbox
                    id={`category-${category}`}
                    checked={localFilters.categories.includes(category)}
                    onCheckedChange={(checked) => 
                      handleCategoryChange(category, checked as boolean)
                    }
                  />
                  <Label htmlFor={`category-${category}`} className="text-sm">
                    {category}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Year Range */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              Year Range: {localFilters.yearRange[0]} - {localFilters.yearRange[1]}
            </Label>
            <Slider
              value={localFilters.yearRange}
              onValueChange={(value) => 
                setLocalFilters(prev => ({ ...prev, yearRange: value as [number, number] }))
              }
              min={1800}
              max={2024}
              step={1}
              className="w-full"
            />
          </div>

          {/* Citations */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              Minimum Citations: {localFilters.minCitations.toLocaleString()}
            </Label>
            <Slider
              value={[localFilters.minCitations]}
              onValueChange={(value) => 
                setLocalFilters(prev => ({ ...prev, minCitations: value[0] }))
              }
              min={0}
              max={10000}
              step={100}
              className="w-full"
            />
          </div>

          {/* Influence */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              Minimum Influence Score: {localFilters.minInfluence}%
            </Label>
            <Slider
              value={[localFilters.minInfluence]}
              onValueChange={(value) => 
                setLocalFilters(prev => ({ ...prev, minInfluence: value[0] }))
              }
              min={0}
              max={100}
              step={5}
              className="w-full"
            />
          </div>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={handleClearFilters}>
            Clear All Filters
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleApplyFilters}>
              Apply Filters
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};