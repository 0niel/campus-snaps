import Link from "next/link";
import type { ReactNode } from "react";

export const metadata = {
  title: "Аутентификация - Campus Snaps",
  description:
    "Войдите или зарегистрируйтесь в фото-платформе студенческого кампуса",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-black bg-[linear-gradient(to_bottom,rgba(0,0,0,0.6)_60%,rgba(0,0,0,0.8)),linear-gradient(to_right,rgba(0,0,0,0.5),rgba(0,0,0,0)_30%),url('/images/auth-bg.jpg')] bg-cover bg-center text-white">
      <main className="flex flex-1 flex-col">{children}</main>
      <footer className="py-4">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Campus Snaps. Все права защищены.</p>
        </div>
      </footer>
    </div>
  );
}
