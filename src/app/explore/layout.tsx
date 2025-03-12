import type { ReactNode } from "react";

export const metadata = {
  title: "Обзор - Campus Snaps",
  description: "Исследуйте фотографии с университетского кампуса",
};

export default function ExploreLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
