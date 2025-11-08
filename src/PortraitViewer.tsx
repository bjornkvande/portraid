import { useState, useRef } from "react";

export function PortraitViewer({ image }: { image: string }) {
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const translateRef = useRef({ x: 0, y: 0 });
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  function handleWheel(e: React.WheelEvent<HTMLDivElement>) {
    const delta = -e.deltaY;
    const zoomFactor = 0.001;
    setScale((prev) => Math.max(0.1, prev + delta * zoomFactor));
  }

  function handleMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    dragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }

  function handleMouseMove(e: MouseEvent) {
    if (!dragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    translateRef.current = {
      x: translateRef.current.x + dx,
      y: translateRef.current.y + dy,
    };
    setTranslate({ ...translateRef.current });
    lastPos.current = { x: e.clientX, y: e.clientY };
  }

  function handleMouseUp() {
    dragging.current = false;
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
  }

  return (
    <div className="bg-white flex justify-center items-center overflow-hidden outline-10 outline-black">
      <div
        className="relative inline-block"
        style={{
          transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
          transformOrigin: "top left",
        }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
      >
        <img
          src={image}
          alt="Dropped"
          className="max-w-full max-h-[90vh] object-contain pointer-events-none select-none"
        />
        <SubdividingGrid gridSize={8} />
      </div>
    </div>
  );
}

type Square = {
  id: string;
  row: number;
  col: number;
  size: number;
  subdivided?: { row: number; col: number; size: number }[];
};

function SubdividingGrid({ gridSize }: { gridSize: number }) {
  const [squares, setSquares] = useState<Square[]>(
    Array.from({ length: gridSize * gridSize }, (_, i) => ({
      id: `s-${i}`,
      row: Math.floor(i / gridSize),
      col: i % gridSize,
      size: 1 / gridSize,
    }))
  );

  const moved = useRef(false);

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
    if (moved.current) return; // prevent subdivision if it was a drag
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
          className="absolute border border-white pointer-events-auto"
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
