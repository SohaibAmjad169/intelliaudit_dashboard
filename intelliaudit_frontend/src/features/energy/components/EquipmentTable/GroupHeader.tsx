import { EquipmentItem } from '../../types';

interface GroupHeaderProps {
  name: string;
  items: EquipmentItem[];
}

export const GroupHeader: React.FC<GroupHeaderProps> = ({ name, items }) => {
  return (
    <div className="flex items-center justify-between">
      <span className="font-semibold">{name}</span>
      <span className="text-muted-foreground ml-2 text-xs">
        ({items.length} items, {items.reduce((sum, item) => sum + (item.quantity || 1), 0)} total units)
      </span>
    </div>
  );
}; 