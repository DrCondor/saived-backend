import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ProjectItem, UpdateItemInput, CustomStatus } from '../../types';
import ItemCard from './ItemCard';

interface SortableItemCardProps {
  item: ProjectItem;
  onUpdate?: (itemId: number, input: UpdateItemInput) => void;
  onDelete?: (itemId: number) => void;
  onToggleFavorite?: (itemId: number, favorite: boolean) => void;
  customStatuses?: CustomStatus[];
}

export default function SortableItemCard({ item, onUpdate, onDelete, onToggleFavorite, customStatuses }: SortableItemCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
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
    // Always use our transition (not dnd-kit's), include opacity for smooth fade on drop
    transition: `transform ${TRANSITION_DURATION} ${TRANSITION_EASING}, opacity 150ms ease-out`,
    opacity: isDragging ? 0.5 : 1,
    // Always hint to browser for GPU acceleration
    willChange: 'transform',
    // Ensure dragged item is on top
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <ItemCard
        item={item}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onToggleFavorite={onToggleFavorite}
        dragHandleProps={{ ...attributes, ...listeners }}
        isDragging={isDragging}
        customStatuses={customStatuses}
      />
    </div>
  );
}
