import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="mb-8">
          <Link
            href="/"
            className="flex items-center text-blue-400 transition-colors hover:text-blue-300"
          >
            <svg
              className="mr-1 h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
            На главную
          </Link>
        </div>

        <h1 className="mb-6 text-3xl font-bold">
          Правила использования Campus Snaps
        </h1>

        <div className="space-y-6 text-gray-300">
          <section>
            <h2 className="mb-3 text-xl font-semibold text-white">
              1. Общие положения
            </h2>
            <p>
              Campus Snaps — это платформа для обмена фотографиями и информацией
              о кампусе университета. Используя наш сервис, вы соглашаетесь с
              настоящими правилами использования.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-white">
              2. Регистрация
            </h2>
            <p>
              Для использования Campus Snaps требуется регистрация с
              использованием адреса электронной почты домена mirea.ru или
              edu.mirea.ru. Регистрация подтверждает вашу связь с университетом
              и обеспечивает доступ к функциям сервиса.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-white">
              3. Правила публикации контента
            </h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                Публикуемый контент не должен нарушать законодательство РФ.
              </li>
              <li>
                Запрещены публикации, содержащие оскорбления, дискриминацию или
                призывы к насилию.
              </li>
              <li>
                Запрещено размещение материалов, нарушающих авторские права.
              </li>
              <li>
                Контент должен соответствовать тематике сервиса и относиться к
                университетскому кампусу.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-white">
              4. Конфиденциальность
            </h2>
            <p>
              Мы обрабатываем ваши персональные данные в соответствии с
              законодательством РФ. Подробная информация содержится в нашей
              Политике конфиденциальности.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-white">
              5. Ответственность
            </h2>
            <p>
              Пользователи несут полную ответственность за публикуемый контент.
              Администрация сервиса оставляет за собой право удалять
              неприемлемый контент и блокировать учетные записи пользователей,
              нарушающих правила использования.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-white">
              6. Изменение правил
            </h2>
            <p>
              Администрация Campus Snaps оставляет за собой право изменять
              настоящие правила в любое время. Изменения вступают в силу с
              момента публикации обновленной версии на сайте.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
