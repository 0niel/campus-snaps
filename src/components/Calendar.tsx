import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { api } from "~/trpc/react";

interface CalendarProps {
  onSelectDate: (date: Date) => void;
  selectedDate: Date | null;
}

export const Calendar: React.FC<CalendarProps> = ({
  onSelectDate,
  selectedDate,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const { data: eventsData } = api.event.getAll.useQuery(
    {
      limit: 100,
      withPhotos: true,
    },
    {
      enabled: true,
      retry: false,
      refetchOnWindowFocus: false,
    },
  );

  const { data: photoDatesData } = api.photo.getDatesWithPhotos.useQuery(
    undefined,
    {
      enabled: true,
      retry: false,
      refetchOnWindowFocus: false,
    },
  );

  const daysWithEvents = useMemo(() => {
    if (!eventsData?.events || !Array.isArray(eventsData.events)) {
      return [];
    }
    return eventsData.events
      .filter((event) => event && event.date)
      .map((event) => new Date(event.date).toDateString());
  }, [eventsData]);

  const daysWithPhotos = useMemo(() => {
    if (!photoDatesData?.dates || !Array.isArray(photoDatesData.dates)) {
      return [];
    }
    return photoDatesData.dates
      .filter((date) => date)
      .map((date) => new Date(date).toDateString());
  }, [photoDatesData]);

  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0,
  ).getDate();
  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1,
  ).getDay();

  const startingDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const prevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1),
    );
  };

  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1),
    );
  };

  const renderDays = () => {
    const days = [];

    for (let i = 0; i < startingDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10 w-10" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        day,
      );
      const dateString = date.toDateString();

      const isSelected =
        selectedDate && selectedDate.toDateString() === dateString;
      const hasEvent = daysWithEvents.includes(dateString);
      const hasPhoto = daysWithPhotos.includes(dateString);

      days.push(
        <motion.button
          key={day}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelectDate(date)}
          className={`flex h-10 w-10 items-center justify-center rounded-full text-sm ${isSelected ? "bg-blue-500 text-white" : "text-gray-300 hover:bg-gray-800"} ${hasEvent || hasPhoto ? "font-medium" : ""} `}
        >
          <div className="relative">
            {day}
            {hasEvent && (
              <div className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-yellow-400"></div>
            )}
            {hasPhoto && !hasEvent && (
              <div className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-green-400"></div>
            )}
          </div>
        </motion.button>,
      );
    }

    return days;
  };

  const monthNames = [
    "Январь",
    "Февраль",
    "Март",
    "Апрель",
    "Май",
    "Июнь",
    "Июль",
    "Август",
    "Сентябрь",
    "Октябрь",
    "Ноябрь",
    "Декабрь",
  ];

  const dayNames = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

  return (
    <div className="calendar">
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="rounded p-1 text-gray-400 hover:bg-gray-800"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <h2 className="text-lg font-medium text-white">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h2>
        <button
          onClick={nextMonth}
          className="rounded p-1 text-gray-400 hover:bg-gray-800"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-500">
        {dayNames.map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">{renderDays()}</div>

      <div className="mt-4 flex justify-center space-x-4 text-xs text-gray-400">
        <div className="flex items-center">
          <div className="mr-1 h-2 w-2 rounded-full bg-yellow-400"></div>
          <span>События</span>
        </div>
        <div className="flex items-center">
          <div className="mr-1 h-2 w-2 rounded-full bg-green-400"></div>
          <span>Фотографии</span>
        </div>
      </div>
    </div>
  );
};
