import React from "react";
import {
  ArchiveBoxXMarkIcon,
  FaceFrownIcon,
  CalendarIcon,
  TagIcon,
  PhotoIcon,
  HeartIcon,
} from "@heroicons/react/24/outline";

interface EmptyStateProps {
  type: "filtered" | "category" | "profile";
  tag?: string | null;
  date?: Date | null;
  view?: string;
  onReset: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  type,
  tag,
  date,
  view,
  onReset,
}) => {
  let icon = <FaceFrownIcon className="h-16 w-16 text-gray-500" />;
  let title = "Ничего не найдено";
  let description = "Попробуйте изменить параметры поиска";

  if (type === "filtered") {
    icon = tag ? (
      <TagIcon className="h-16 w-16 text-gray-500" />
    ) : (
      <CalendarIcon className="h-16 w-16 text-gray-500" />
    );
    title = tag
      ? `Нет фотографий с тегом #${tag}`
      : date
        ? `Нет фотографий на ${date.toLocaleDateString("ru-RU")}`
        : "Ничего не найдено";
    description = "Попробуйте другой тег или дату";
  } else if (type === "category") {
    icon =
      view === "events" ? (
        <CalendarIcon className="h-16 w-16 text-gray-500" />
      ) : (
        <ArchiveBoxXMarkIcon className="h-16 w-16 text-gray-500" />
      );
    title =
      view === "events"
        ? "Нет предстоящих мероприятий"
        : "В этой категории ничего нет";
    description =
      view === "events"
        ? "Скоро здесь появятся новые мероприятия"
        : "Попробуйте посмотреть все фотографии";
  } else if (type === "profile") {
    if (view === "photos") {
      icon = <PhotoIcon className="h-16 w-16 text-gray-500" />;
      title = "У вас еще нет фотографий";
      description = "Загрузите свои первые фотографии";
    } else if (view === "events") {
      icon = <CalendarIcon className="h-16 w-16 text-gray-500" />;
      title = "Вы не создавали мероприятий";
      description = "Создайте свое первое мероприятие";
    } else if (view === "likes") {
      icon = <HeartIcon className="h-16 w-16 text-gray-500" />;
      title = "Нет отмеченных фотографий";
      description = "Лайкните фотографии, чтобы они появились здесь";
    }
  }

  return (
    <div className="flex flex-col items-center justify-center rounded-xl bg-gray-900 p-8 text-center">
      <div className="rounded-full bg-gray-800 p-6">{icon}</div>
      <h3 className="mt-4 text-xl font-medium text-white">{title}</h3>
      <p className="mt-2 max-w-sm text-gray-400">{description}</p>
      <button
        onClick={onReset}
        className="mt-4 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-500"
      >
        Сбросить все фильтры
      </button>
    </div>
  );
};
