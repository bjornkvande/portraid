import { useState, useRef, useEffect } from "react";

type Point = { x: number; y: number };
type Line = { a: Point | null; b: Point | null };

type State = { scale?: number; translate?: Point };

export function GridMeasure(props: {
  container: HTMLDivElement | null;
  image: HTMLImageElement | null;
  translate: Point;
  scale: number;
  widthMM: number;
}) {
  const container = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    container.current = props.container;
  }, [props.container]);

  const state = useRef<State>({}) as State;
  useEffect(() => {
    state.scale = props.scale;
    state.translate = props.translate;
  }, [props.scale, props.translate]);

  const canvas = useRef<HTMLCanvasElement>(null);
  const [line, setLine] = useState<Line>({ a: null, b: null });

  // track mouse in IMAGE coordinates
  const mousePos = useRef({ x: 0, y: 0 });
  function trackMousePos(e: MouseEvent) {
    if (!container.current) return;

    // mouse pos relative to wrapper
    const rect = container.current.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    // including translation and scale
    x = (x - (state.translate?.x ?? 0)) / (state.scale ?? 1);
    y = (y - (state.translate?.y ?? 0)) / (state.scale ?? 1);

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
    const image = props.image;
    if (!image || !c || !pen) return;

    // match rendered (scaled) image
    c.width = image.clientWidth;
    c.height = image.clientHeight;

    // clear it
    pen.clearRect(0, 0, c.width, c.height);
    if (!(line.a && line.b)) return;

    // draw the line
    pen.strokeStyle = "red";
    pen.lineWidth = 2;
    pen.beginPath();
    pen.moveTo(line.a.x, line.a.y);
    pen.lineTo(line.b.x, line.b.y);
    pen.stroke();

    // draw the label at midpoint
    const distanceMM = getLineLengthMM(line.a, line.b, image, props.widthMM);
    const mid = {
      x: (line.a.x + line.b.x) / 2,
      y: (line.a.y + line.b.y) / 2,
    };
    const angle = Math.atan2(line.b.y - line.a.y, line.b.x - line.a.x);
    pen.save();
    pen.translate(mid.x, mid.y);
    pen.rotate(angle);
    pen.fillStyle = "#ffffffaa";
    const label = `${distanceMM.toFixed(1)} mm`;
    const width = pen.measureText(label).width + 14;
    pen.fillRect(-width / 2, -16, width, 14);
    pen.font = "12px sans-serif";
    pen.textAlign = "center";
    pen.textBaseline = "bottom";
    pen.fillStyle = "black";
    pen.fillText(label, 0, -2); // slightly above the line
    pen.restore();
  }, [line, props.widthMM, props.image]);

  return <canvas className="absolute top-0 left-0" ref={canvas}></canvas>;
}

function getLineLengthMM(
  a: Point,
  b: Point,
  image: HTMLImageElement,
  widthMM: number
) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const distPx = Math.sqrt(dx * dx + dy * dy);
  const pxPerMM = image.clientWidth / widthMM; // pixels per mm along width
  return distPx / pxPerMM;
}
