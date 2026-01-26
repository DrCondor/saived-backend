import { useSortable, type AnimateLayoutChanges } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ProjectItem, UpdateItemInput, CustomStatus } from '../../types';
import ItemCardCompact from './ItemCardCompact';

interface SortableItemCardCompactProps {
  item: ProjectItem;
  onUpdate?: (itemId: number, input: UpdateItemInput) => void;
  onDelete?: (itemId: number) => void;
  onToggleFavorite?: (itemId: number, favorite: boolean) => void;
  customStatuses?: CustomStatus[];
}

// Always animate for smooth transitions
const animateLayoutChanges: AnimateLayoutChanges = () => true;

export default function SortableItemCardCompact({ item, onUpdate, onDelete, onToggleFavorite, customStatuses }: SortableItemCardCompactProps) {
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

  const TRANSITION_EASING = 'cubic-bezier(0.25, 1, 0.5, 1)';
  const TRANSITION_DURATION = '250ms';

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition || `transform ${TRANSITION_DURATION} ${TRANSITION_EASING}`,
    opacity: isDragging ? 0.5 : 1,
    willChange: transform ? 'transform' : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <ItemCardCompact
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
