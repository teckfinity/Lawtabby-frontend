import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Filter, Search } from "lucide-react";
import { useCitationFilterOptions } from "@/api/hooks/useCitationMaps";

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

interface CourtOption {
  /** Display name shown to the user. */
  name: string;
  /** All backend court ids that share this display name. */
  ids: string[];
}

interface CategoryOption {
  /** Clean label without the nature-of-suit numeric code. */
  label: string;
  /** All raw backend values that map to this label. */
  values: string[];
}

const COURT_GROUP_ORDER = [
  "U.S. Supreme Court",
  "Federal Appeals (Circuit Courts)",
  "Federal District Courts",
  "State Courts",
  "Specialty Courts",
] as const;

const courtGroupOf = (name: string): (typeof COURT_GROUP_ORDER)[number] => {
  if (name === "Supreme Court") return "U.S. Supreme Court";
  if (/Circuit$/i.test(name)) return "Federal Appeals (Circuit Courts)";
  if (/^[NSEWCM]?\.?D\.\s/i.test(name) || name === "District of Columbia") {
    return "Federal District Courts";
  }
  if (/Foreign Intelligence/i.test(name)) return "Specialty Courts";
  return "State Courts";
};

/** "368 Asbestos personal injury - Prod. Liab." → "Asbestos personal injury - Prod. Liab." */
const cleanCategoryLabel = (raw: string): string => raw.replace(/^\s*\d+\s*/, "").trim() || raw;

/** Key for merging near-duplicate categories ("440 Civil rights other" vs "440 Civil Rights: Other"). */
const categoryKey = (raw: string): string =>
  cleanCategoryLabel(raw).toLowerCase().replace(/[^a-z0-9]/g, "");

export const FilterModal = ({ open, onOpenChange, filters, onFiltersChange }: FilterModalProps) => {
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);
  const [courtSearch, setCourtSearch] = useState("");
  const { data: options, isLoading } = useCitationFilterOptions();

  const yearMin = options?.year_min ?? 1800;
  const yearMax = options?.year_max ?? new Date().getFullYear();

  // Merge courts that share a display name (backend can hold duplicates with
  // distinct ids) so each court appears once; selecting it selects every id.
  const courtGroups = useMemo(() => {
    const byName = new Map<string, CourtOption>();
    for (const court of options?.courts ?? []) {
      const existing = byName.get(court.name);
      if (existing) existing.ids.push(court.id);
      else byName.set(court.name, { name: court.name, ids: [court.id] });
    }
    const groups = new Map<string, CourtOption[]>();
    for (const option of byName.values()) {
      const group = courtGroupOf(option.name);
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group)!.push(option);
    }
    for (const list of groups.values()) list.sort((a, b) => a.name.localeCompare(b.name));
    return groups;
  }, [options]);

  const categoryOptions: CategoryOption[] = useMemo(() => {
    const byKey = new Map<string, CategoryOption>();
    for (const raw of options?.categories ?? []) {
      const key = categoryKey(raw);
      const existing = byKey.get(key);
      if (existing) existing.values.push(raw);
      else byKey.set(key, { label: cleanCategoryLabel(raw), values: [raw] });
    }
    return [...byKey.values()].sort((a, b) => a.label.localeCompare(b.label));
  }, [options]);

  useEffect(() => {
    if (open) {
      setLocalFilters(filters);
      setCourtSearch("");
    }
  }, [open, filters]);

  const isCourtChecked = (option: CourtOption) =>
    option.ids.some((id) => localFilters.courts.includes(id));

  const handleCourtChange = (option: CourtOption, checked: boolean) => {
    setLocalFilters((prev) => ({
      ...prev,
      courts: checked
        ? [...new Set([...prev.courts, ...option.ids])]
        : prev.courts.filter((id) => !option.ids.includes(id)),
    }));
  };

  const isCategoryChecked = (option: CategoryOption) =>
    option.values.some((v) => localFilters.categories.includes(v));

  const handleCategoryChange = (option: CategoryOption, checked: boolean) => {
    setLocalFilters((prev) => ({
      ...prev,
      categories: checked
        ? [...new Set([...prev.categories, ...option.values])]
        : prev.categories.filter((v) => !option.values.includes(v)),
    }));
  };

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
    onOpenChange(false);
  };

  const handleClearFilters = () => {
    const clearedFilters: FilterState = {
      courts: [],
      categories: [],
      yearRange: [yearMin, yearMax],
      minCitations: 0,
      minInfluence: 0,
    };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (localFilters.courts.length > 0) count++;
    if (localFilters.categories.length > 0) count++;
    if (localFilters.yearRange[0] > yearMin || localFilters.yearRange[1] < yearMax) count++;
    if (localFilters.minCitations > 0) count++;
    if (localFilters.minInfluence > 0) count++;
    return count;
  };

  const courtMatchesSearch = (name: string) =>
    !courtSearch.trim() || name.toLowerCase().includes(courtSearch.trim().toLowerCase());

  const selectedCourtCount = useMemo(() => {
    let count = 0;
    for (const list of courtGroups.values()) {
      for (const option of list) {
        if (option.ids.some((id) => localFilters.courts.includes(id))) count++;
      }
    }
    return count;
  }, [courtGroups, localFilters.courts]);

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
            Narrow the map to the courts, legal areas, and time period you care about.
            Filters apply to the current map and every new search.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4 max-h-[60vh] overflow-y-auto pr-1">
          {/* Courts */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-base font-semibold">Courts</Label>
              {selectedCourtCount > 0 && (
                <span className="text-xs text-muted-foreground">
                  {selectedCourtCount} selected
                </span>
              )}
            </div>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading courts…</p>
            ) : courtGroups.size === 0 ? (
              <p className="text-sm text-muted-foreground">No courts available yet</p>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Find a court (e.g. Ninth Circuit)…"
                    className="pl-9 h-9"
                    value={courtSearch}
                    onChange={(e) => setCourtSearch(e.target.value)}
                  />
                </div>
                <div className="space-y-4">
                  {COURT_GROUP_ORDER.map((groupName) => {
                    const list = (courtGroups.get(groupName) ?? []).filter((o) =>
                      courtMatchesSearch(o.name)
                    );
                    if (list.length === 0) return null;
                    return (
                      <div key={groupName} className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">{groupName}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {list.map((option) => (
                            <div key={option.name} className="flex items-center space-x-2">
                              <Checkbox
                                id={`court-${option.name}`}
                                checked={isCourtChecked(option)}
                                onCheckedChange={(checked) =>
                                  handleCourtChange(option, checked as boolean)
                                }
                              />
                              <Label htmlFor={`court-${option.name}`} className="text-sm">
                                {option.name}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Categories */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Legal Areas</Label>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading legal areas…</p>
            ) : categoryOptions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No legal areas available yet</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {categoryOptions.map((option) => (
                  <div key={option.label} className="flex items-center space-x-2">
                    <Checkbox
                      id={`category-${option.label}`}
                      checked={isCategoryChecked(option)}
                      onCheckedChange={(checked) =>
                        handleCategoryChange(option, checked as boolean)
                      }
                    />
                    <Label htmlFor={`category-${option.label}`} className="text-sm">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            )}
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
              min={yearMin}
              max={yearMax}
              step={1}
              className="w-full"
            />
          </div>

          {/* Citations */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              Minimum Citations: {localFilters.minCitations.toLocaleString()}
            </Label>
            <p className="text-xs text-muted-foreground">
              Only show cases cited at least this many times.
            </p>
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
              Minimum Influence Score: {localFilters.minInfluence}/100
            </Label>
            <p className="text-xs text-muted-foreground">
              Only show cases at or above this influence level.
            </p>
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
