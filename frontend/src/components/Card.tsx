import { ReactNode } from "react";

interface CardProps {
  title?: string;
  children: ReactNode;
  tone?: "blue" | "gold" | "green" | "red" | "neutral";
  className?: string;
}

export function Card({ title, children, tone = "neutral", className = "" }: CardProps) {
  // We remove the harsh colored borders and use subtle modern styling
  return (
    <div className={`card-container ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold text-navy mb-4 border-b border-border pb-3">
          {title}
        </h3>
      )}
      <div>{children}</div>
    </div>
  );
}
