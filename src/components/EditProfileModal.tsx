"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  XMarkIcon,
  CheckIcon,
  ArrowUpTrayIcon,
} from "@heroicons/react/24/outline";
import { useDropzone } from "react-dropzone";
import Compressor from "compressorjs";
import { api } from "~/trpc/react";
import type { User } from "~/types";

interface EditProfileModalProps {
  user?: User;
  onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  user,
  onClose,
}) => {
  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [academicGroup, setAcademicGroup] = useState(
    user?.academicGroup?.id || "",
  );
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    user?.image || null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: academicGroups } = api.user.getAcademicGroups.useQuery();

  const uploadAvatarMutation = api.upload.uploadFile.useMutation();

  const updateProfileMutation = api.user.updateProfile.useMutation({
    onSuccess: () => {
      onClose();

      window.location.reload();
    },
    onError: (error) => {
      setError(`Ошибка обновления профиля: ${error.message}`);
      setIsSubmitting(false);
    },
  });

  const onDrop = React.useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
      setAvatarFile(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
    maxSize: 5 * 1024 * 1024,
    multiple: false,
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      let imageUrl = user?.image || undefined;

      if (avatarFile) {
        const compressedFile = await new Promise<File>((resolve, reject) => {
          new Compressor(avatarFile, {
            quality: 0.8,
            maxWidth: 500,
            maxHeight: 500,
            success(result) {
              resolve(
                new File([result], avatarFile.name, { type: result.type }),
              );
            },
            error(err) {
              reject(err);
            },
          });
        });

        const base64 = await fileToBase64(compressedFile);

        const uploadResult = await uploadAvatarMutation.mutateAsync({
          filename: compressedFile.name,
          contentType: compressedFile.type,
          base64Data: base64,
        });

        if (uploadResult.success) {
          imageUrl = uploadResult.url;
        }
      }

      await updateProfileMutation.mutateAsync({
        name,
        bio: bio || undefined,
        academicGroupId: academicGroup ? parseInt(academicGroup) : undefined,
        image: imageUrl,
      });
    } catch (err: any) {
      setError(err.message || "Произошла ошибка при обновлении профиля");
      setIsSubmitting(false);
    }
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
          className="max-h-[90vh] w-full max-w-lg overflow-hidden rounded-xl bg-gray-900 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-800 px-6 py-4">
            <h3 className="text-xl font-semibold text-white">
              Редактирование профиля
            </h3>
            <button
              type="button"
              className="rounded-full p-1.5 text-gray-400 hover:bg-gray-800 hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={onClose}
              disabled={isSubmitting}
            >
              <span className="sr-only">Закрыть</span>
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Form content */}
          <div className="overflow-y-auto p-6">
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                {/* Avatar upload */}
                <div className="flex flex-col items-center">
                  <div
                    {...getRootProps()}
                    className={`relative h-24 w-24 cursor-pointer overflow-hidden rounded-full bg-gray-800 ${isDragActive ? "ring-2 ring-blue-500" : ""}`}
                  >
                    <input {...getInputProps()} />
                    {avatarPreview ? (
                      <Image
                        src={avatarPreview}
                        alt="Avatar preview"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-gray-400">
                        {name?.charAt(0) || "U"}
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity hover:opacity-100">
                      <ArrowUpTrayIcon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-gray-400">
                    Нажмите для загрузки аватара
                  </p>
                </div>

                {/* Name */}
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-300"
                  >
                    Имя
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-white shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Academic group */}
                <div>
                  <label
                    htmlFor="academicGroup"
                    className="block text-sm font-medium text-gray-300"
                  >
                    Учебная группа
                  </label>
                  <select
                    id="academicGroup"
                    value={academicGroup}
                    onChange={(e) => setAcademicGroup(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-white shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Не выбрана</option>
                    {academicGroups?.groups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Bio */}
                <div>
                  <label
                    htmlFor="bio"
                    className="block text-sm font-medium text-gray-300"
                  >
                    О себе
                  </label>
                  <textarea
                    id="bio"
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Расскажите о себе..."
                    className="mt-1 block w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-white shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Error message */}
                {error && (
                  <div className="rounded-lg bg-red-900/30 p-4 text-sm text-red-300">
                    <div className="flex">
                      <svg
                        className="h-5 w-5 text-red-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <p className="ml-3">{error}</p>
                    </div>
                  </div>
                )}

                {/* Submit button */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className={`inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      isSubmitting ? "cursor-not-allowed opacity-75" : ""
                    }`}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
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
                        Сохранение...
                      </>
                    ) : (
                      <>
                        <CheckIcon className="mr-2 h-4 w-4" />
                        Сохранить
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
