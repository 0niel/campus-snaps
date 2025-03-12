"use client";

import React, {
  useState,
  useRef,
  useCallback,
  ChangeEvent,
  useEffect,
} from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { TAGS } from "~/constants";
import { useDropzone } from "react-dropzone";
import { useSession } from "next-auth/react";
import Compressor from "compressorjs";
import { api } from "~/trpc/react";
import {
  CalendarIcon,
  TagIcon,
  PhotoIcon,
  PlusIcon,
  XMarkIcon,
  ArrowUpTrayIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  PencilSquareIcon,
  GlobeAltIcon,
} from "@heroicons/react/24/outline";
import vkService from "~/services/vkService";

type UploadModalProps = {
  onClose: () => void;
};

export function UploadModal({ onClose }: UploadModalProps) {
  const { data: session } = useSession();
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState("");
  const [eventId, setEventId] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({
    name: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [activeStep, setActiveStep] = useState(1);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);

  const [vkEnabled, setVkEnabled] = useState(false);
  const [vkAuthStatus, setVkAuthStatus] = useState<
    "not_connected" | "connecting" | "connected"
  >("not_connected");
  const [vkAlbumMode, setVkAlbumMode] = useState<"create" | "select">("create");
  const [vkNewAlbum, setVkNewAlbum] = useState({
    title: "",
    description: "",
    privacy: "all",
  });
  const [vkSelectedAlbumId, setVkSelectedAlbumId] = useState<string | null>(
    null,
  );
  const [vkGroups, setVkGroups] = useState<{ id: string; name: string }[]>([]);
  const [vkSelectedGroupId, setVkSelectedGroupId] = useState<string | null>(
    null,
  );
  const [vkAlbums, setVkAlbums] = useState<{ id: string; title: string }[]>([]);

  const { data: events, refetch: refetchEvents } = api.event.getAll.useQuery({
    limit: 10,
    upcoming: true,
  });

  const uploadFileMutation = api.upload.uploadFile.useMutation();

  const createPhotoMutation = api.photo.createPhoto.useMutation();

  const createEventMutation = api.event.create.useMutation({
    onSuccess: (data) => {
      void refetchEvents();
      setEventId(data.id);
      setShowCreateEvent(false);
      setIsCreatingEvent(false);
    },
    onError: (error) => {
      setError(`Ошибка создания мероприятия: ${error.message}`);
      setIsCreatingEvent(false);
    },
  });

  const handleCreateEvent = () => {
    if (!newEvent.name || !newEvent.date) {
      setError("Название и дата мероприятия обязательны");
      return;
    }

    setIsCreatingEvent(true);
    setError(null);

    createEventMutation.mutate({
      name: newEvent.name,
      description: newEvent.description || undefined,
      date: new Date(newEvent.date),
    });
  };

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setError(null);

      const newFiles = acceptedFiles.slice(0, 5 - files.length);

      if (newFiles.length === 0) return;

      const newPreviews = newFiles.map((file) => URL.createObjectURL(file));

      setFiles((prev) => [...prev, ...newFiles]);
      setPreviews((prev) => [...prev, ...newPreviews]);

      if (activeStep === 1) {
        setActiveStep(2);
      }
    },
    [files.length, activeStep],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
    maxSize: 10 * 1024 * 1024,
    disabled: files.length >= 5 || isUploading,
  });

  const handleAddTag = () => {
    if (
      !currentTag.trim() ||
      tags.includes(currentTag.trim()) ||
      tags.length >= 5
    )
      return;

    setTags((prev) => [...prev, currentTag.trim()]);
    setCurrentTag("");
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((tag) => tag !== tagToRemove));
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });

    if (files.length <= 1) {
      setActiveStep(1);
    }
  };

  useEffect(() => {
    const checkVkAuth = () => {
      if (vkService.isAuthenticated()) {
        setVkAuthStatus("connected");
        void loadVkGroups();
      }
    };

    const handleAuthMessage = (event: MessageEvent) => {
      if (
        event.origin === window.location.origin &&
        event.data?.type === "vk-auth-callback" &&
        event.data?.hash
      ) {
        const success = vkService.handleAuthCallback(event.data.hash);
        if (success) {
          setVkAuthStatus("connected");
          void loadVkGroups();
        } else {
          setVkAuthStatus("not_connected");
          setError("Не удалось авторизоваться в VK");
        }
      }
    };

    window.addEventListener("message", handleAuthMessage);
    checkVkAuth();

    return () => {
      window.removeEventListener("message", handleAuthMessage);
    };
  }, []);

  const loadVkGroups = async () => {
    try {
      const groups = await vkService.getUserGroups();
      setVkGroups(groups);
    } catch (err) {
      console.error("Error loading VK groups:", err);
    }
  };

  const handleVkAuth = () => {
    setVkAuthStatus("connecting");

    const authUrl = vkService.getAuthUrl();
    const width = 600;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    window.open(
      authUrl,
      "vkauth",
      `width=${width},height=${height},top=${top},left=${left}`,
    );
  };

  const handleVkGroupChange = async (groupId: string) => {
    setVkSelectedGroupId(groupId);
    setVkSelectedAlbumId(null);

    if (!groupId) return;

    try {
      const albums = await vkService.getGroupAlbums(groupId);
      setVkAlbums(albums);
    } catch (err) {
      console.error("Error loading VK albums:", err);
      setVkAlbums([]);
    }
  };

  const handleUpload = async () => {
    if (!session?.user) {
      setError("Вы должны быть авторизованы для загрузки фотографий");
      return;
    }

    if (files.length === 0) {
      setError("Добавьте хотя бы одну фотографию");
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      let successCount = 0;
      let vkAlbumId = null;

      if (vkEnabled && vkAuthStatus === "connected" && vkSelectedGroupId) {
        if (vkAlbumMode === "create" && vkNewAlbum.title) {
          vkAlbumId = await vkService.createAlbum(
            vkSelectedGroupId,
            vkNewAlbum.title,
            vkNewAlbum.description,
            vkNewAlbum.privacy,
          );

          if (!vkAlbumId) {
            setError("Ошибка создания альбома в ВКонтакте");
            setIsUploading(false);
            return;
          }
        } else if (vkAlbumMode === "select") {
          vkAlbumId = vkSelectedAlbumId;
        }
      }

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        const compressedFile = await new Promise<File>((resolve, reject) => {
          new Compressor(file, {
            quality: 0.8,
            maxWidth: 1920,
            maxHeight: 1080,
            success(result) {
              resolve(new File([result], file.name, { type: result.type }));
            },
            error(err) {
              reject(err);
            },
          });
        });

        const base64 = await fileToBase64(compressedFile);

        const uploadResult = await uploadFileMutation.mutateAsync({
          filename: compressedFile.name,
          contentType: compressedFile.type,
          base64Data: base64,
        });

        if (!uploadResult.success) {
          throw new Error("Ошибка загрузки файла");
        }

        if (
          vkEnabled &&
          vkAuthStatus === "connected" &&
          vkAlbumId &&
          vkSelectedGroupId
        ) {
          try {
            await vkService.uploadPhoto(
              vkAlbumId,
              vkSelectedGroupId,
              compressedFile,
            );
          } catch (vkErr) {
            console.error("Error uploading to VK:", vkErr);
          }
        }

        await createPhotoMutation.mutateAsync({
          url: uploadResult.url,
          description: description || undefined,
          eventId: eventId ?? undefined,
          tags: tags,
        });

        successCount++;
        setUploadProgress(Math.round((successCount / files.length) * 100));
      }

      setSuccess(true);

      setTimeout(() => {
        onClose();

        window.location.reload();
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Произошла ошибка при загрузке фотографий");
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === "string") {
          const base64 = reader.result.split(",")[1];
          resolve(base64);
        } else {
          reject(new Error("Failed to convert file to base64"));
        }
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const suggestedTags = TAGS.filter(
    (tag) =>
      !tags.includes(tag) &&
      tag.toLowerCase().includes(currentTag.toLowerCase()),
  ).slice(0, 5);

  const goToNextStep = () => {
    if (activeStep < 3) {
      setActiveStep(activeStep + 1);
    } else {
      void handleUpload();
    }
  };

  const goToPreviousStep = () => {
    if (activeStep > 1) {
      setActiveStep(activeStep - 1);
    }
  };

  const isStepComplete = () => {
    if (activeStep === 1) return files.length > 0;
    if (activeStep === 2) return true;
    if (activeStep === 3) {
      if (vkEnabled && vkAuthStatus === "connected") {
        if (vkAlbumMode === "create") {
          return !!vkNewAlbum.title && !!vkSelectedGroupId;
        } else {
          return !!vkSelectedAlbumId && !!vkSelectedGroupId;
        }
      }
      return true;
    }
    return false;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: "spring", duration: 0.3 }}
          className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-xl bg-gray-900 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-800 px-6 py-4">
            <h3 className="text-xl font-semibold text-white">
              {success ? "Загрузка завершена" : "Загрузка фотографий"}
            </h3>
            <button
              type="button"
              className="rounded-full p-1.5 text-gray-400 hover:bg-gray-800 hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={onClose}
              disabled={isUploading}
            >
              <span className="sr-only">Закрыть</span>
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Progress steps - only show when not in success state */}
          {!success && (
            <div className="border-b border-gray-800 px-6 py-3">
              <div className="mb-1 flex items-center justify-between">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex flex-col items-center">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                        step < activeStep
                          ? "bg-blue-600 text-white"
                          : step === activeStep
                            ? "bg-blue-500/20 text-blue-400 ring-2 ring-blue-500"
                            : "bg-gray-800 text-gray-500"
                      }`}
                    >
                      {step < activeStep ? (
                        <CheckCircleIcon className="h-5 w-5" />
                      ) : (
                        <span>{step}</span>
                      )}
                    </div>
                    <span
                      className={`mt-1 text-xs ${step === activeStep ? "font-medium text-blue-400" : "text-gray-500"}`}
                    >
                      {step === 1
                        ? "Выбор файлов"
                        : step === 2
                          ? "Описание"
                          : "Публикация"}
                    </span>
                  </div>
                ))}
              </div>
              <div className="relative mt-1">
                <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 bg-gray-800"></div>
                <div
                  className="absolute left-0 top-1/2 h-1 -translate-y-1/2 bg-blue-600 transition-all duration-300"
                  style={{ width: `${((activeStep - 1) / 2) * 100}%` }}
                ></div>
              </div>
            </div>
          )}

          <div className="max-h-[calc(90vh-160px)] overflow-y-auto text-gray-200">
            {success ? (
              <div className="p-6 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-900/30">
                  <CheckCircleIcon className="h-10 w-10 text-green-500" />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-white">
                  Фотографии успешно загружены
                </h3>
                <p className="mt-2 text-sm text-gray-400">
                  {files.length === 1
                    ? "Фотография добавлена в вашу коллекцию и появится в ленте."
                    : `Все ${files.length} фотографий добавлены в вашу коллекцию и появятся в ленте.`}
                </p>
                {vkEnabled && vkAuthStatus === "connected" && (
                  <div className="mt-3">
                    <div className="flex items-center justify-center text-sm font-medium text-blue-400">
                      <CheckCircleIcon className="mr-1 h-5 w-5 text-green-500" />
                      <span>
                        Фотографии успешно добавлены в альбом ВКонтакте
                      </span>
                    </div>
                  </div>
                )}

                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {previews.map((preview, index) => (
                    <div
                      key={index}
                      className="h-16 w-16 overflow-hidden rounded-lg bg-gray-800"
                    >
                      <Image
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        width={64}
                        height={64}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-6">
                {/* Step 1: File upload */}
                {activeStep === 1 && (
                  <div className="space-y-4">
                    <div
                      {...getRootProps()}
                      className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 transition-colors ${isDragActive ? "border-blue-500 bg-blue-900/20" : "border-gray-700 hover:bg-gray-800"} ${isUploading ? "cursor-not-allowed opacity-50" : ""} `}
                    >
                      <input {...getInputProps()} disabled={isUploading} />
                      <div className="mb-4 rounded-full bg-blue-900/30 p-3">
                        <PhotoIcon className="h-7 w-7 text-blue-500" />
                      </div>
                      <p className="mb-1 text-sm font-medium text-gray-200">
                        {isDragActive
                          ? "Отпустите файлы здесь"
                          : "Перетяните сюда фотографии или нажмите для выбора"}
                      </p>
                      <p className="text-xs text-gray-400">
                        JPG, PNG или WebP (макс. 10MB)
                      </p>
                      <p className="mt-2 text-xs font-medium text-blue-400">
                        Можно выбрать до 5 фотографий
                      </p>
                    </div>

                    {/* Image previews */}
                    {previews.length > 0 && (
                      <div className="mt-4">
                        <h4 className="mb-3 text-sm font-medium text-gray-300">
                          Выбранные фотографии ({previews.length}/5)
                        </h4>
                        <div className="grid grid-cols-5 gap-3">
                          {previews.map((preview, index) => (
                            <div key={index} className="group relative">
                              <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-800">
                                <Image
                                  src={preview}
                                  alt={`Preview ${index + 1}`}
                                  fill
                                  className="object-cover"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeFile(index);
                                    }}
                                    disabled={isUploading}
                                    className="rounded-full bg-white/20 p-1.5 text-white transition-colors hover:bg-white/40"
                                  >
                                    <XMarkIcon className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}

                          {previews.length < 5 && (
                            <div
                              {...getRootProps()}
                              className="relative flex aspect-square cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-700 hover:bg-gray-800"
                            >
                              <input
                                {...getInputProps()}
                                disabled={isUploading}
                              />
                              <PlusIcon className="h-6 w-6 text-gray-500" />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 2: Description */}
                {activeStep === 2 && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-medium text-gray-200">
                      Добавьте описание
                    </h2>

                    {/* Image preview carousel */}
                    <div className="scrollbar-hide flex space-x-2 overflow-x-auto py-2">
                      {previews.map((preview, index) => (
                        <div
                          key={index}
                          className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-gray-800"
                        >
                          <Image
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            width={64}
                            height={64}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ))}
                    </div>

                    <textarea
                      rows={5}
                      placeholder="Расскажите о ваших фотографиях..."
                      className="block w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-900 sm:text-sm"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      disabled={isUploading}
                    />

                    <p className="text-xs text-gray-400">
                      Хорошее описание помогает другим пользователям находить
                      ваши фотографии и понимать их контекст
                    </p>
                  </div>
                )}

                {/* Step 3: Tags, Event and VK Upload */}
                {activeStep === 3 && (
                  <div className="space-y-6">
                    {/* Tags section */}
                    <div>
                      <div className="mb-2 flex items-center">
                        <TagIcon className="mr-2 h-5 w-5 text-blue-500" />
                        <h4 className="text-base font-medium text-gray-200">
                          Теги
                        </h4>
                      </div>
                      <div className="mb-2">
                        <div className="flex flex-wrap gap-2 rounded-lg border border-gray-700 bg-gray-800 p-3 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                          {tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center rounded-full bg-blue-900/50 px-2.5 py-1 text-sm font-medium text-blue-300"
                            >
                              #{tag}
                              <button
                                type="button"
                                onClick={() => removeTag(tag)}
                                disabled={isUploading}
                                className="ml-1 rounded-full text-blue-400 hover:text-blue-200 focus:outline-none"
                              >
                                <XMarkIcon className="h-4 w-4" />
                              </button>
                            </span>
                          ))}
                          {tags.length < 5 && (
                            <input
                              type="text"
                              value={currentTag}
                              onChange={(e) => setCurrentTag(e.target.value)}
                              onKeyDown={handleTagKeyDown}
                              onBlur={handleAddTag}
                              placeholder={
                                tags.length === 0 ? "Добавьте теги..." : ""
                              }
                              className="min-w-[100px] flex-1 border-0 bg-transparent p-0 text-sm text-gray-200 focus:outline-none focus:ring-0"
                              disabled={isUploading}
                            />
                          )}
                        </div>
                        <p className="mt-1 text-xs text-gray-400">
                          Добавьте до 5 тегов для лучшего поиска фотографий
                        </p>
                      </div>

                      {/* Suggested tags */}
                      {currentTag && suggestedTags.length > 0 && (
                        <div className="mt-2">
                          <p className="mb-1 text-xs text-gray-400">
                            Популярные теги:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {suggestedTags.map((tag) => (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => {
                                  if (tags.length < 5 && !tags.includes(tag)) {
                                    setTags((prev) => [...prev, tag]);
                                  }
                                }}
                                disabled={
                                  tags.length >= 5 || tags.includes(tag)
                                }
                                className="rounded-full bg-gray-800 px-2.5 py-1 text-xs font-medium text-gray-300 hover:bg-gray-700"
                              >
                                #{tag}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Event selection */}
                    <div>
                      <div className="mb-2 flex items-center">
                        <CalendarIcon className="mr-2 h-5 w-5 text-blue-500" />
                        <h4 className="text-base font-medium text-gray-200">
                          Мероприятие
                        </h4>
                      </div>

                      {showCreateEvent ? (
                        <div className="overflow-hidden rounded-lg border border-gray-700 bg-gray-800/50">
                          <div className="border-b border-gray-700 bg-gradient-to-r from-blue-900/30 to-purple-900/30 px-4 py-3">
                            <div className="flex items-center justify-between">
                              <h5 className="font-medium text-blue-100">
                                Создание нового мероприятия
                              </h5>
                              <button
                                className="rounded-md p-1 hover:bg-gray-700/50"
                                onClick={() => setShowCreateEvent(false)}
                              >
                                <XMarkIcon className="h-5 w-5 text-gray-400" />
                              </button>
                            </div>
                          </div>

                          <div className="space-y-4 p-4">
                            <div className="grid grid-cols-1 gap-4">
                              <div>
                                <label
                                  htmlFor="eventName"
                                  className="mb-1 block text-sm font-medium text-gray-300"
                                >
                                  Название мероприятия*
                                </label>
                                <input
                                  type="text"
                                  id="eventName"
                                  placeholder="Введите название мероприятия"
                                  value={newEvent.name}
                                  onChange={(e) =>
                                    setNewEvent({
                                      ...newEvent,
                                      name: e.target.value,
                                    })
                                  }
                                  className="block w-full rounded-lg border-gray-700 bg-gray-900 px-3 py-2 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                />
                              </div>

                              <div>
                                <label
                                  htmlFor="eventDate"
                                  className="mb-1 block text-sm font-medium text-gray-300"
                                >
                                  Дата мероприятия*
                                </label>
                                <input
                                  type="date"
                                  id="eventDate"
                                  value={newEvent.date}
                                  onChange={(e) =>
                                    setNewEvent({
                                      ...newEvent,
                                      date: e.target.value,
                                    })
                                  }
                                  className="block w-full rounded-lg border-gray-700 bg-gray-900 px-3 py-2 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                />
                              </div>

                              <div>
                                <label
                                  htmlFor="eventDescription"
                                  className="mb-1 block text-sm font-medium text-gray-300"
                                >
                                  Описание мероприятия
                                </label>
                                <textarea
                                  id="eventDescription"
                                  rows={3}
                                  placeholder="Добавьте описание мероприятия..."
                                  value={newEvent.description}
                                  onChange={(e) =>
                                    setNewEvent({
                                      ...newEvent,
                                      description: e.target.value,
                                    })
                                  }
                                  className="block w-full rounded-lg border-gray-700 bg-gray-900 px-3 py-2 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                />
                              </div>
                            </div>

                            <div className="flex justify-end pt-2">
                              <button
                                type="button"
                                className="inline-flex items-center rounded-lg border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-75 disabled:hover:bg-blue-600"
                                onClick={handleCreateEvent}
                                disabled={
                                  !newEvent.name ||
                                  !newEvent.date ||
                                  isCreatingEvent
                                }
                              >
                                {isCreatingEvent ? (
                                  <>
                                    <svg
                                      className="mr-2 h-4 w-4 animate-spin"
                                      viewBox="0 0 24 24"
                                    >
                                      <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                        fill="none"
                                      />
                                      <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                      />
                                    </svg>
                                    Создание...
                                  </>
                                ) : (
                                  <>
                                    <PlusIcon className="mr-1.5 h-4 w-4" />
                                    Создать мероприятие
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-2">
                            <select
                              id="event"
                              className="block w-full border-0 bg-transparent text-gray-200 focus:ring-0 sm:text-sm"
                              value={eventId || ""}
                              onChange={(e) =>
                                setEventId(
                                  e.target.value
                                    ? parseInt(e.target.value)
                                    : null,
                                )
                              }
                              disabled={isUploading}
                            >
                              <option value="">
                                Не связывать с мероприятием
                              </option>
                              {events?.events.map((event) => (
                                <option key={event.id} value={event.id}>
                                  {event.title} (
                                  {new Date(event.date).toLocaleDateString(
                                    "ru-RU",
                                  )}
                                  )
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="mt-3">
                            <button
                              type="button"
                              onClick={() => setShowCreateEvent(true)}
                              className="inline-flex items-center text-sm font-medium text-blue-400 hover:text-blue-300"
                            >
                              <PlusIcon className="mr-1 h-4 w-4" />
                              Создать новое мероприятие
                            </button>
                          </div>
                        </>
                      )}
                    </div>

                    {/* VK Upload Section */}
                    <div className="overflow-hidden rounded-lg border border-gray-700">
                      <div className="flex items-center justify-between border-b border-gray-700 bg-gradient-to-r from-blue-900/40 to-indigo-900/40 px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <div className="relative h-6 w-6 flex-shrink-0">
                            <Image
                              src="/vk-logo.svg"
                              alt="ВКонтакте"
                              width={24}
                              height={24}
                              className="object-contain"
                            />
                          </div>
                          <h4 className="font-medium text-blue-100">
                            Публикация в ВКонтакте
                          </h4>
                        </div>

                        <div className="flex items-center">
                          <label className="inline-flex cursor-pointer items-center">
                            <input
                              type="checkbox"
                              className="peer sr-only"
                              checked={vkEnabled}
                              onChange={() => setVkEnabled(!vkEnabled)}
                            />
                            <div className="peer relative h-5 w-10 rounded-full bg-gray-700 after:absolute after:start-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rtl:peer-checked:after:-translate-x-full"></div>
                          </label>
                        </div>
                      </div>

                      {vkEnabled && (
                        <div className="bg-gradient-to-b from-indigo-900/10 to-transparent p-4">
                          {vkAuthStatus === "not_connected" && (
                            <div className="flex flex-col items-center space-y-4 px-4 py-6 text-center">
                              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-900/20">
                                <GlobeAltIcon className="h-8 w-8 text-blue-400" />
                              </div>
                              <div>
                                <h5 className="mb-1 font-medium text-gray-200">
                                  Подключите аккаунт ВКонтакте
                                </h5>
                                <p className="text-sm text-gray-400">
                                  Чтобы загрузить фотографии в сообщество,
                                  необходим доступ к вашему аккаунту
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={handleVkAuth}
                                className="inline-flex items-center justify-center rounded-lg bg-[#0077FF] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#0066CC] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                              >
                                <span className="mr-2">
                                  <svg
                                    viewBox="0 0 24 24"
                                    width="16"
                                    height="16"
                                    fill="currentColor"
                                  >
                                    <path d="M15.68 14.32c.44.44 1.09.63 1.48.63.24 0 .4-.03.41-.03h2.76a.86.86 0 0 0 .55-.89c-.05-.52-.45-1.24-1.87-2.65-.84-.83-1.5-1.25-1.64-1.64-.14-.39-.01-.62.13-.98.15-.36 1.26-1.96 1.89-2.85.84-1.27 1.21-2.07.76-2.57H19.63c-.83 0-.99.2-1.23.57-.37.57-1.4 1.7-1.95 2.07-.52.37-.81.43-1.08.43-.24 0-.32-.06-.32-.48V8.6c0-.85-.17-1.08-1.05-1.08h-3.47c-.6 0-.94.27-1.28.67-.33.37-.27.55.32.55.59 0 .74.3.74.66v1.76c0 .92-.02.98-.67.98-.63 0-2.06-2.21-2.97-4-.16-.31-.61-.62-1.08-.62H4.78c-.69 0-.78.31-.78.61 0 .67 1.16 3.84 2.8 5.97 1.36 1.75 2.9 2.67 4.73 2.67.96 0 1.22-.22 1.22-.75v-1.73c0-.58.12-.7.57-.7.36 0 .89.15 2.33 1.48l.04.02Z" />
                                  </svg>
                                </span>
                                Войти через ВКонтакте
                              </button>
                            </div>
                          )}

                          {vkAuthStatus === "connecting" && (
                            <div className="flex flex-col items-center px-4 py-8 text-center">
                              <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                              <p className="font-medium text-blue-400">
                                Подключение к ВКонтакте...
                              </p>
                            </div>
                          )}

                          {vkAuthStatus === "connected" && (
                            <div className="space-y-4">
                              <div className="mb-4 flex items-center rounded-lg bg-gradient-to-r from-blue-500/10 to-indigo-500/10 p-3">
                                <div className="mr-3 flex-shrink-0">
                                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-900/30">
                                    <Image
                                      src="/vk-logo.svg"
                                      alt="ВКонтакте"
                                      width={24}
                                      height={24}
                                      className="object-contain"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <h5 className="font-medium text-gray-200">
                                    Аккаунт ВКонтакте подключен
                                  </h5>
                                  <p className="text-sm text-gray-400">
                                    Выберите сообщество и альбом для загрузки
                                    фотографий
                                  </p>
                                </div>
                              </div>

                              <div>
                                <label
                                  htmlFor="vkGroup"
                                  className="mb-1 block text-sm font-medium text-gray-300"
                                >
                                  Сообщество
                                </label>
                                <select
                                  id="vkGroup"
                                  className="block w-full rounded-lg border-gray-700 bg-gray-900 px-3 py-2 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                  value={vkSelectedGroupId || ""}
                                  onChange={(e) =>
                                    handleVkGroupChange(e.target.value)
                                  }
                                >
                                  <option value="">Выберите сообщество</option>
                                  {vkGroups.map((group) => (
                                    <option key={group.id} value={group.id}>
                                      {group.name}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {vkSelectedGroupId && (
                                <div>
                                  <label
                                    htmlFor="vkAlbumMode"
                                    className="mb-1 block text-sm font-medium text-gray-300"
                                  >
                                    Альбом
                                  </label>
                                  <div className="flex items-center space-x-4">
                                    <label className="inline-flex items-center">
                                      <input
                                        type="radio"
                                        name="vkAlbumMode"
                                        value="create"
                                        checked={vkAlbumMode === "create"}
                                        onChange={() =>
                                          setVkAlbumMode("create")
                                        }
                                        className="form-radio h-4 w-4 text-blue-600 transition duration-150 ease-in-out"
                                      />
                                      <span className="ml-2 text-gray-300">
                                        Создать новый
                                      </span>
                                    </label>
                                    <label className="inline-flex items-center">
                                      <input
                                        type="radio"
                                        name="vkAlbumMode"
                                        value="select"
                                        checked={vkAlbumMode === "select"}
                                        onChange={() =>
                                          setVkAlbumMode("select")
                                        }
                                        className="form-radio h-4 w-4 text-blue-600 transition duration-150 ease-in-out"
                                      />
                                      <span className="ml-2 text-gray-300">
                                        Выбрать существующий
                                      </span>
                                    </label>
                                  </div>
                                </div>
                              )}

                              {vkAlbumMode === "create" &&
                                vkSelectedGroupId && (
                                  <div className="space-y-4">
                                    <div>
                                      <label
                                        htmlFor="vkNewAlbumTitle"
                                        className="mb-1 block text-sm font-medium text-gray-300"
                                      >
                                        Название альбома
                                      </label>
                                      <input
                                        type="text"
                                        id="vkNewAlbumTitle"
                                        placeholder="Введите название альбома"
                                        value={vkNewAlbum.title}
                                        onChange={(e) =>
                                          setVkNewAlbum({
                                            ...vkNewAlbum,
                                            title: e.target.value,
                                          })
                                        }
                                        className="block w-full rounded-lg border-gray-700 bg-gray-900 px-3 py-2 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                      />
                                    </div>

                                    <div>
                                      <label
                                        htmlFor="vkNewAlbumDescription"
                                        className="mb-1 block text-sm font-medium text-gray-300"
                                      >
                                        Описание альбома
                                      </label>
                                      <textarea
                                        id="vkNewAlbumDescription"
                                        rows={3}
                                        placeholder="Добавьте описание альбома..."
                                        value={vkNewAlbum.description}
                                        onChange={(e) =>
                                          setVkNewAlbum({
                                            ...vkNewAlbum,
                                            description: e.target.value,
                                          })
                                        }
                                        className="block w-full rounded-lg border-gray-700 bg-gray-900 px-3 py-2 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                      />
                                    </div>

                                    <div>
                                      <label
                                        htmlFor="vkNewAlbumPrivacy"
                                        className="mb-1 block text-sm font-medium text-gray-300"
                                      >
                                        Приватность альбома
                                      </label>
                                      <select
                                        id="vkNewAlbumPrivacy"
                                        className="block w-full rounded-lg border-gray-700 bg-gray-900 px-3 py-2 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                        value={vkNewAlbum.privacy}
                                        onChange={(e) =>
                                          setVkNewAlbum({
                                            ...vkNewAlbum,
                                            privacy: e.target.value,
                                          })
                                        }
                                      >
                                        <option value="all">
                                          Все пользователи
                                        </option>
                                        <option value="friends">
                                          Только друзья
                                        </option>
                                        <option value="private">
                                          Только я
                                        </option>
                                      </select>
                                    </div>
                                  </div>
                                )}

                              {vkAlbumMode === "select" &&
                                vkSelectedGroupId && (
                                  <div>
                                    <label
                                      htmlFor="vkSelectedAlbum"
                                      className="mb-1 block text-sm font-medium text-gray-300"
                                    >
                                      Выберите альбом
                                    </label>
                                    <select
                                      id="vkSelectedAlbum"
                                      className="block w-full rounded-lg border-gray-700 bg-gray-900 px-3 py-2 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                      value={vkSelectedAlbumId || ""}
                                      onChange={(e) =>
                                        setVkSelectedAlbumId(e.target.value)
                                      }
                                    >
                                      <option value="">Выберите альбом</option>
                                      {vkAlbums.map((album) => (
                                        <option key={album.id} value={album.id}>
                                          {album.title}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Error message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 rounded-lg bg-red-900/30 p-4"
                  >
                    <div className="flex">
                      <ExclamationCircleIcon className="h-5 w-5 text-red-400" />
                      <div className="ml-3">
                        <p className="text-sm text-red-300">{error}</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Upload progress */}
                {isUploading && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-blue-400">
                        Загрузка...
                      </span>
                      <span className="text-gray-400">{uploadProgress}%</span>
                    </div>
                    <div className="relative mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-800">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        className="absolute h-full rounded-full bg-blue-600"
                      ></motion.div>
                    </div>
                  </div>
                )}

                {/* Navigation buttons */}
                <div className="mt-6 flex items-center justify-between">
                  <button
                    type="button"
                    className="inline-flex items-center rounded-lg border border-gray-600 bg-gray-800 px-4 py-2 text-sm font-medium text-gray-300 shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                    onClick={goToPreviousStep}
                    disabled={activeStep === 1 || isUploading}
                  >
                    <svg
                      className="mr-1 h-4 w-4"
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
                    Назад
                  </button>

                  <button
                    type="button"
                    className={`inline-flex items-center rounded-lg border px-4 py-2 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${
                      activeStep === 3
                        ? "border-transparent bg-green-600 text-white hover:bg-green-700 focus:ring-green-500"
                        : "border-transparent bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500"
                    }`}
                    onClick={goToNextStep}
                    disabled={!isStepComplete() || isUploading}
                  >
                    {activeStep === 3 ? (
                      <>
                        <ArrowUpTrayIcon className="mr-1 h-4 w-4" />
                        Загрузить
                      </>
                    ) : (
                      <>
                        Далее
                        <svg
                          className="ml-1 h-4 w-4"
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
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
