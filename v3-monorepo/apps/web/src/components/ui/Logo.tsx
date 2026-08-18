import Image from "next/image";

export function Logo({ className = "", width = 180 }: { className?: string; width?: number }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <img
        src="https://markshare.com.br/wp-content/uploads/2023/01/Ativo-1@4x-1024x196.png"
        alt="MarkShare"
        width={width}
        style={{ objectFit: "contain" }}
      />
    </div>
  );
}
