import { useSortable, defaultAnimateLayoutChanges, type AnimateLayoutChanges } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ProjectItem, UpdateItemInput, CustomStatus } from '../../types';
import ItemCard from './ItemCard';

interface SortableItemCardProps {
  item: ProjectItem;
  onUpdate?: (itemId: number, input: UpdateItemInput) => void;
  onDelete?: (itemId: number) => void;
  customStatuses?: CustomStatus[];
}

// Custom animateLayoutChanges that always animates
// - During sorting: animate item shifts
// - After drop: animate all items to their final positions (prevents flash)
const animateLayoutChanges: AnimateLayoutChanges = () => {
  // Always return true to ensure smooth transitions
  // This prevents the flash where items briefly appear at old positions
  return true;
};

export default function SortableItemCard({ item, onUpdate, onDelete, customStatuses }: SortableItemCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    animateLayoutChanges,
    data: {
      type: 'item',
      item,
    },
  });

  // Smooth easing curve for natural feel
  const TRANSITION_EASING = 'cubic-bezier(0.25, 1, 0.5, 1)';
  const TRANSITION_DURATION = '250ms';

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    // Always have transition - this ensures smooth animations:
    // 1. During drag: items shift smoothly
    // 2. After drop: items animate to final positions (no flash)
    transition: transition || `transform ${TRANSITION_DURATION} ${TRANSITION_EASING}`,
    opacity: isDragging ? 0.5 : 1,
    // Ensure hardware acceleration for smoother animations
    willChange: transform ? 'transform' : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <ItemCard
        item={item}
        onUpdate={onUpdate}
        onDelete={onDelete}
        dragHandleProps={{ ...attributes, ...listeners }}
        isDragging={isDragging}
        customStatuses={customStatuses}
      />
    </div>
  );
}
