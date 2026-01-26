import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ProjectItem } from '../../types';
import ItemCardMoodboard from './ItemCardMoodboard';

interface SortableItemCardMoodboardProps {
  item: ProjectItem;
  onToggleFavorite?: (itemId: number, favorite: boolean) => void;
}

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
    data: {
      type: 'item',
      item,
    },
  });

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
      <ItemCardMoodboard
        item={item}
        onToggleFavorite={onToggleFavorite}
        dragHandleProps={{ ...attributes, ...listeners }}
        isDragging={isDragging}
      />
    </div>
  );
}
