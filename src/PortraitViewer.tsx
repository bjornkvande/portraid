import { useState, useRef, useEffect, useMemo } from "react";

import { Grid } from "./Grid.tsx";
import { GridMeasure } from "./GridMeasure.tsx";

export function PortraitViewer({ image }: { image: string }) {
  const savedState = useMemo(() => {
    return JSON.parse(localStorage.getItem("portraid:viewerState") || "{}");
    // eslint-disable-next-line
  }, [image]);

  // we need access to the image and wrapper elements to calculate width/height/distance
  const imageRef = useRef<HTMLImageElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // to avoid problems with event handlers not getting updated state, we use refs
  const scale = useRef(1);
  const translateRef = useRef(savedState.translate ?? { x: 0, y: 0 });
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const [, forceUpdate] = useState(0);

  // enable adding the width and showing the height of the image in mm
  const [widthMM, setWidthMM] = useState<number>(() => {
    return parseInt(localStorage.getItem("portraid:widthMM") || "200");
  });
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null);
  useEffect(() => {
    localStorage.setItem("portraid:widthMM", String(widthMM));
  }, [widthMM]);

  // save viewer state when anything changes
  const [gridVisible, setGridVisible] = useState(
    savedState.gridVisible ?? true
  );
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
      forceUpdate((n) => n + 1);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const heightMM = imgSize ? Math.round(widthMM * (imgSize.h / imgSize.w)) : 0;

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
        <GridMeasure
          container={wrapperRef.current}
          image={imageRef.current}
          translate={translateRef.current}
          scale={scale.current}
          widthMM={widthMM}
        />
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
          <Grid gridSize={8} />
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
