import { Draggable } from '@hello-pangea/dnd';
import KanbanCard from './KanbanCard';

const COLOR_MAP = {
  blue:   'border-blue-400   bg-blue-50',
  amber:  'border-amber-400  bg-amber-50',
  purple: 'border-purple-400 bg-purple-50',
  green:  'border-green-400  bg-green-50',
  red:    'border-red-300    bg-red-50',
};

const BADGE_MAP = {
  blue:   'bg-blue-100   text-blue-700',
  amber:  'bg-amber-100  text-amber-700',
  purple: 'bg-purple-100 text-purple-700',
  green:  'bg-green-100  text-green-700',
  red:    'bg-red-100    text-red-600',
};

export default function KanbanColumn({ column, leads, provided, isDraggingOver, onCardClick }) {
  return (
    <div
      className={`w-72 flex-shrink-0 flex flex-col rounded-xl border-t-4 ${COLOR_MAP[column.color]} ${
        isDraggingOver ? 'ring-2 ring-indigo-300 ring-offset-2' : ''
      }`}
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">{column.emoji}</span>
          <h3 className="text-sm font-semibold text-gray-800">{column.label}</h3>
        </div>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${BADGE_MAP[column.color]}`}>
          {leads.length}
        </span>
      </div>

      {/* Cards list */}
      <div
        ref={provided.innerRef}
        {...provided.droppableProps}
        className="flex-1 overflow-y-auto px-3 pb-3 space-y-2 min-h-[100px]"
      >
        {leads.map((lead, index) => (
          <Draggable key={lead.id} draggableId={lead.id} index={index}>
            {(dragProvided, dragSnapshot) => (
              <KanbanCard
                lead={lead}
                provided={dragProvided}
                isDragging={dragSnapshot.isDragging}
                onClick={() => onCardClick(lead)}
              />
            )}
          </Draggable>
        ))}
        {provided.placeholder}
      </div>
    </div>
  );
}
