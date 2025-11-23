import { useState, useRef, useEffect } from "react";

type Square = {
  id: string;
  row: number;
  col: number;
  size: number;
  subdivided?: { row: number; col: number; size: number }[];
};

export function Grid({ gridSize }: { gridSize: number }) {
  // --- Load saved squares OR create default grid ---
  const [squares, setSquares] = useState<Square[]>(() => {
    const saved = localStorage.getItem("portraid:grid");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // no need to do anything
      }
    }
    return Array.from({ length: gridSize * gridSize }, (_, i) => ({
      id: `s-${i}`,
      row: Math.floor(i / gridSize),
      col: i % gridSize,
      size: 1 / gridSize,
    }));
  });

  const moved = useRef(false);

  // --- Persist grid to localStorage ---
  useEffect(() => {
    localStorage.setItem("portraid:grid", JSON.stringify(squares));
  }, [squares]);

  function handleMouseDown() {
    moved.current = false;
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }

  function handleMouseMove() {
    moved.current = true;
  }

  function handleMouseUp() {
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
    setTimeout(() => {
      moved.current = false;
    }, 0);
  }

  function handleLeftClick(square: Square, e: React.MouseEvent) {
    e.stopPropagation();
    if (moved.current) return;
    if (square.subdivided) {
      hideSubSquare(square);
    } else {
      showSubSquare(square);
    }
    moved.current = false;
  }

  function showSubSquare(square: Square) {
    const newSub = [
      { row: 0, col: 0, size: square.size / 2 },
      { row: 0, col: 1, size: square.size / 2 },
      { row: 1, col: 0, size: square.size / 2 },
      { row: 1, col: 1, size: square.size / 2 },
    ];
    setSquares((prev) =>
      prev.map((s) => (s.id === square.id ? { ...s, subdivided: newSub } : s))
    );
  }

  function hideSubSquare(square: Square) {
    setSquares((prev) =>
      prev.map((s) =>
        s.id === square.id ? { ...s, subdivided: undefined } : s
      )
    );
  }

  function renderSquare(square: Square, parentLeft = 0, parentTop = 0) {
    const left = parentLeft + square.col * square.size * 100;
    const top = parentTop + square.row * square.size * 100;
    const sizePct = square.size * 100;

    return (
      <div key={square.id}>
        <div
          className="absolute border border-white/50 pointer-events-auto"
          style={{
            left: `${left}%`,
            top: `${top}%`,
            width: `${sizePct}%`,
            height: `${sizePct}%`,
          }}
          onClick={(e) => handleLeftClick(square, e)}
        />
        {square.subdivided &&
          square.subdivided.map((sub, i) => (
            <div
              key={`${square.id}-sub-${i}`}
              className="absolute border border-white/30 pointer-events-auto"
              style={{
                left: `${left + sub.col * sub.size * 100}%`,
                top: `${top + sub.row * sub.size * 100}%`,
                width: `${sub.size * 100}%`,
                height: `${sub.size * 100}%`,
              }}
              onClick={(e) => handleLeftClick(square, e)}
            />
          ))}
      </div>
    );
  }

  return (
    <div onMouseDown={handleMouseDown}>
      {squares.map((s) => renderSquare(s))}
    </div>
  );
}
