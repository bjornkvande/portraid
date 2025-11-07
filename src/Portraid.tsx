import { useState } from "react";
import type { DragEvent } from "react";
import { PortraitViewer } from "./PortraitViewer";

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
      className="w-full h-screen flex justify-center items-center bg-gray-800 p-8"
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
