import { useState, useRef, DragEvent } from "react";

export function Portraid() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  async function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    const image = await readDroppedFile(e.dataTransfer.files[0]);
    setImageSrc(image);
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
  }

  return (
    <div
      className="w-full h-screen flex justify-center items-center bg-gray-100"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {!imageSrc ? (
        <div className="w-96 h-64 border-4 border-dashed border-gray-400 flex justify-center items-center text-gray-600">
          Drag & Drop a JPG image here
        </div>
      ) : (
        <PortraitViewer image={imageSrc} />
      )}
    </div>
  );
}

function PortraitViewer({ image }: { image: string }) {
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const translateRef = useRef({ x: 0, y: 0 }); // to keep in sync
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  function handleWheel(e: React.WheelEvent<HTMLDivElement>) {
    const delta = -e.deltaY; // invert to zoom in/out naturally
    const zoomFactor = 0.001; // sensitivity
    setScale((prev) => Math.max(0.1, prev + delta * zoomFactor));
  }

  function handleMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    dragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };

    // Attach listeners to window for smooth dragging
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
    // Remove window listeners
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
  }

  return (
    <div className="p-8 bg-white rounded shadow flex justify-center items-center overflow-hidden">
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
        <GridOverlay />
      </div>
    </div>
  );
}

function GridOverlay() {
  const gridLines = 9;
  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
      {[...Array(gridLines)].map((_, i) => (
        <div
          key={`h-${i}`}
          className="absolute left-0 w-full border-t border-white"
          style={{ top: `${(i * 100) / (gridLines - 1)}%` }}
        />
      ))}
      {[...Array(gridLines)].map((_, i) => (
        <div
          key={`v-${i}`}
          className="absolute top-0 h-full border-l border-white"
          style={{ left: `${(i * 100) / (gridLines - 1)}%` }}
        />
      ))}
    </div>
  );
}

function readDroppedFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file && file.type === "image/jpeg") {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.onerror = () => {
        reject(new Error("Failed to read file"));
      };
      reader.readAsDataURL(file);
    } else {
      reject(new Error("Please drop a JPG image."));
    }
  });
}
