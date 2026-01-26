import { useSortable, type AnimateLayoutChanges } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ProjectItem } from '../../types';
import ItemCardMoodboard from './ItemCardMoodboard';

interface SortableItemCardMoodboardProps {
  item: ProjectItem;
  onToggleFavorite?: (itemId: number, favorite: boolean) => void;
}

// Always animate for smooth transitions
const animateLayoutChanges: AnimateLayoutChanges = () => true;

export default function SortableItemCardMoodboard({ item, onToggleFavorite }: SortableItemCardMoodboardProps) {
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
      <ItemCardMoodboard
        item={item}
        onToggleFavorite={onToggleFavorite}
        dragHandleProps={{ ...attributes, ...listeners }}
        isDragging={isDragging}
      />
    </div>
  );
}
