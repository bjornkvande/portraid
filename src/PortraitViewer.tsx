import { useState, useRef, useEffect, useMemo } from "react";

type Point = { x: number; y: number };
type Line = { a: Point | null; b: Point | null };

export function PortraitViewer({ image }: { image: string }) {
  // the state of the app
  const savedState = useMemo(() => {
    return JSON.parse(localStorage.getItem("portraid:viewerState") || "{}");
    // eslint-disable-next-line
  }, [image]);

  // to avoid problems with event handlers not getting updated state, we use refs
  const scale = useRef(1);
  const translateRef = useRef(savedState.translate ?? { x: 0, y: 0 });
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const [, forceUpdate] = useState(0);

  const [gridVisible, setGridVisible] = useState(
    savedState.gridVisible ?? true
  );

  // enable adding the width and showing the height of the image in mm
  const [widthMM, setWidthMM] = useState<number>(() => {
    return parseInt(localStorage.getItem("portraid:widthMM") || "200");
  });
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null);
  const heightMM = imgSize ? Math.round(widthMM * (imgSize.h / imgSize.w)) : 0;
  useEffect(() => {
    localStorage.setItem("portraid:widthMM", String(widthMM));
  }, [widthMM]);

  // save viewer state when anything changes
  useEffect(() => {
    const state = { scale, translate: translateRef.current, gridVisible };
    localStorage.setItem("portraid:viewerState", JSON.stringify(state));
  }, [scale, translateRef.current.x, gridVisible]);

  // handle all the events needed for image movement and zooming
  function handleWheel(e: React.WheelEvent<HTMLDivElement>) {
    const delta = -e.deltaY;
    const zoomFactor = 0.001;
    scale.current = Math.max(0.1, scale.current + delta * zoomFactor);
    forceUpdate((n) => n + 1);
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
    lastPos.current = { x: e.clientX, y: e.clientY };
    forceUpdate((n) => n + 1);
  }

  function handleMouseUp() {
    dragging.current = false;
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
  }

  // the user can toggle the grid on or off
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "g") {
        setGridVisible((v: boolean) => !v);
      } else if (e.key === "0") {
        scale.current = 1;
        translateRef.current = { x: 0, y: 0 };
      } else if (["1", "2", "4"].includes(e.key)) {
        scale.current = parseInt(e.key);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // the user can place a line on the image to measure distance between two points
  const canvas = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [line, setLine] = useState<Line>({ a: null, b: null });

  // track mouse in IMAGE coordinates
  const mousePos = useRef({ x: 0, y: 0 });
  function trackMousePos(e: MouseEvent) {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    // mouse pos relative to wrapper
    const rect = wrapper.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    // including translation and scale
    x = (x - translateRef.current.x) / scale.current;
    y = (y - translateRef.current.y) / scale.current;

    mousePos.current = { x, y };
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "a") {
        const { x, y } = mousePos.current;
        setLine((prev) => ({ ...prev, a: { x, y } }));
      } else if (e.key === "b") {
        const { x, y } = mousePos.current;
        setLine((prev) => ({ ...prev, b: { x, y } }));
      } else if (e.key === "Escape") {
        setLine({ a: null, b: null });
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousemove", trackMousePos);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousemove", trackMousePos);
    };
  }, []);

  // paint the line on the canvas if set
  useEffect(() => {
    const c = canvas?.current;
    const pen = c?.getContext?.("2d");
    const img = imageRef.current;
    if (!img || !c || !pen) return;

    // match rendered (scaled) image
    c.width = img.clientWidth;
    c.height = img.clientHeight;

    pen.clearRect(0, 0, c.width, c.height);

    if (!(line.a && line.b)) return;

    const a = line.a;
    const b = line.b;

    //   // const a = { x: line.a.x * scale, y: line.a.y * scale };
    //   // const b = { x: line.b.x * scale, y: line.b.y * scale };
    //   const a = {
    //     x: line.a.x * scale + translate.x,
    //     y: line.a.y * scale + translate.y,
    //   };
    //   const b = {
    //     x: line.b.x * scale + translate.x,
    //     y: line.b.y * scale + translate.y,
    //   };

    // draw
    pen.strokeStyle = "red";
    pen.lineWidth = 2;
    pen.beginPath();
    pen.moveTo(a.x, a.y);
    pen.lineTo(b.x, b.y);
    pen.stroke();
    // }, [line, scale.current, translateRef.current.x, translateRef.current.y]);
  }, [line, translateRef.current.x, translateRef.current.y]);

  return (
    <div
      ref={wrapperRef}
      className="bg-white flex justify-center items-center overflow-hidden outline-5 outline-black"
    >
      <div
        className="relative inline-block"
        style={{
          transform: `translate(${translateRef.current.x}px, ${translateRef.current.y}px) scale(${scale.current})`,
          transformOrigin: "top left",
        }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
      >
        <canvas className="absolute top-0 left-0" ref={canvas}></canvas>
        <img
          src={image}
          ref={imageRef}
          alt="Dropped"
          className="max-w-full max-h-[95vh] object-contain pointer-events-none select-none"
          onLoad={(e) => {
            const img = e.currentTarget;
            setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
          }}
        />
        <div
          className={`transition-opacity duration-200 ${
            gridVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          <SubdividingGrid gridSize={8} />
        </div>
      </div>

      <div className="absolute top-0 flex justify-center items-center h-6">
        <input
          className="bg-white z-50 px-1 h-full w-12 text-center"
          value={widthMM}
          onChange={(e) => setWidthMM(Number(e.target.value))}
        />
        <span className="text-black bg-white ml-2 px-2">{heightMM}</span>
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
