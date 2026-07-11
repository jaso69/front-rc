import type { Design } from "@schema/design.ts";

interface Props {
  design: Design;
  screenIndex: number;
  onSelect: (index: number) => void;
  onAdd: () => void;
  onDelete: (index: number) => void;
  onRename: (index: number, name: string) => void;
}

export function ScreenTabs({ design, screenIndex, onSelect, onAdd, onDelete, onRename }: Props) {
  return (
    <div className="screen-tabs">
      {design.screens.map((screen, i) => (
        <div
          key={screen.id}
          className={`screen-tab${i === screenIndex ? " active" : ""}`}
          onClick={() => onSelect(i)}
        >
          <input
            type="text"
            value={screen.name}
            onChange={(e) => onRename(i, e.target.value)}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "transparent",
              border: "none",
              color: i === screenIndex ? "#fff" : "#aaa",
              width: `${Math.max(60, screen.name.length * 8)}px`,
              fontSize: 13,
            }}
          />
          {design.screens.length > 1 && (
            <span
              className="del"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(i);
              }}
            >
              ×
            </span>
          )}
        </div>
      ))}
      <button className="screen-tab add" onClick={onAdd}>+ Pantalla</button>
    </div>
  );
}
