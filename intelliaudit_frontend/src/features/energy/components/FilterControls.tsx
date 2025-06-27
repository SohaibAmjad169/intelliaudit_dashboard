import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface FilterControlsProps {
  searchQuery: string;
  selectedCategory: string;
  categories: string[];
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
}

export const FilterControls: React.FC<FilterControlsProps> = ({
  searchQuery,
  selectedCategory,
  categories,
  onSearchChange,
  onCategoryChange
}) => {
  return (
    <div className="flex space-x-2">
      <Input
        placeholder="Filter equipment..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-56 h-8 text-sm bg-zinc-800 border-zinc-700"
      />
      <Select value={selectedCategory} onValueChange={onCategoryChange}>
        <SelectTrigger className="w-44 h-8 text-sm bg-zinc-800 border-zinc-700">
          <SelectValue placeholder="All Categories" />
        </SelectTrigger>
        <SelectContent className="bg-zinc-800 border-zinc-700">
          <SelectItem value="all">All Categories</SelectItem>
          {categories.map(category => (
            <SelectItem key={category} value={category}>
              {category}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}; 