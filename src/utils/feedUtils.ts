import type { FeedItem } from "~/types";

/**
 * Smart feed processor that properly groups items and eliminates duplicates
 */
export function processSmartFeed(items: FeedItem[]): FeedItem[] {
  if (!items.length) return [];

  const seenIds = new Set<string>();
  const processedItems: FeedItem[] = [];

  const itemsByDate = new Map<string, FeedItem[]>();
  const itemsByGroup = new Map<string, FeedItem[]>();
  const itemsByUser = new Map<string, FeedItem[]>();

  const TIME_WINDOW_MS = 5 * 60 * 1000;
  const photosByBatch = new Map<string, FeedItem[]>();

  const safelyGetDateString = (dateValue: any): string => {
    if (!dateValue) return "";

    try {
      const date = new Date(dateValue);

      if (isNaN(date.getTime())) {
        return "";
      }

      return date.toISOString().split("T")[0];
    } catch (error) {
      console.error("Error parsing date:", dateValue, error);
      return "";
    }
  };

  const safelyGetTimestamp = (dateValue: any): number => {
    if (!dateValue) return 0;

    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) {
        return 0;
      }
      return date.getTime();
    } catch (error) {
      return 0;
    }
  };

  const photoItems: { item: FeedItem; timestamp: number }[] = [];

  items.forEach((item) => {
    if (!item || !item.type || !item.id || !item.data) {
      return;
    }

    const itemId = `${item.type}-${item.id}`;

    if (seenIds.has(itemId)) return;
    seenIds.add(itemId);

    if (item.type === "photo") {
      const timestamp = safelyGetTimestamp(
        item.data.uploadDate || item.data.createdAt,
      );
      if (timestamp > 0) {
        photoItems.push({ item, timestamp });
      }
    }

    let dateStr = "";
    let groupId = "";
    let userId = "";

    try {
      switch (item.type) {
        case "photo":
          dateStr = safelyGetDateString(
            item.data.uploadDate || item.data.createdAt,
          );
          userId = item.data.userId;
          if (item.data.groupId) groupId = item.data.groupId;
          break;
        case "album":
          dateStr = safelyGetDateString(item.data.createdAt);
          userId = item.data.userId;
          if (item.data.groupId) groupId = item.data.groupId;
          break;
        case "event":
          dateStr = safelyGetDateString(item.data.date);
          if (item.data.groupId) groupId = item.data.groupId;
          break;
        case "userPhotos":
          dateStr = safelyGetDateString(item.data.createdAt);
          userId = item.data.userId;
          break;
        case "groupPhotos":
          dateStr = safelyGetDateString(item.data.createdAt);
          groupId = item.data.groupId;
          break;
      }

      if (!dateStr) {
        dateStr = new Date().toISOString().split("T")[0];
      }

      if (dateStr) {
        const dayItems = itemsByDate.get(dateStr) || [];
        dayItems.push(item);
        itemsByDate.set(dateStr, dayItems);
      }

      if (groupId) {
        const groupItems = itemsByGroup.get(groupId) || [];
        groupItems.push(item);
        itemsByGroup.set(groupId, groupItems);
      }

      if (userId) {
        const userItems = itemsByUser.get(userId) || [];
        userItems.push(item);
        itemsByUser.set(userId, userItems);
      }
    } catch (error) {
      console.error("Error processing feed item:", item, error);
    }
  });

  photoItems.sort((a, b) => b.timestamp - a.timestamp);

  let currentBatchId = 0;
  let lastTimestamp = 0;
  let lastUserId = "";

  photoItems.forEach(({ item, timestamp }, index) => {
    const userId = item.data.userId;

    if (
      index === 0 ||
      userId !== lastUserId ||
      lastTimestamp - timestamp > TIME_WINDOW_MS
    ) {
      currentBatchId++;
      lastUserId = userId;
    }

    const batchKey = `${userId}-batch-${currentBatchId}`;
    const batchItems = photosByBatch.get(batchKey) || [];
    batchItems.push(item);
    photosByBatch.set(batchKey, batchItems);

    lastTimestamp = timestamp;
  });

  photosByBatch.forEach((batchPhotos, batchKey) => {
    if (batchPhotos.length >= 2) {
      const firstPhoto = batchPhotos[0];
      const userId = firstPhoto.data.userId;
      const userName = firstPhoto.data.user?.name || "Пользователь";

      const userPhotosItem: FeedItem = {
        id: `batch-${batchKey}`,
        type: "userPhotos",
        title: `Загружено ${userName}`,
        data: {
          userId,
          user: firstPhoto.data.user,
          photos: batchPhotos.map((p) => p.data),
          createdAt: firstPhoto.data.uploadDate || firstPhoto.data.createdAt,
        },
        date: new Date(
          safelyGetTimestamp(
            firstPhoto.data.uploadDate || firstPhoto.data.createdAt,
          ),
        ),
      };

      processedItems.push(userPhotosItem);

      batchPhotos.forEach((photo) => {
        seenIds.add(`processed-${photo.type}-${photo.id}`);
      });
    }
  });

  const sortedDates = Array.from(itemsByDate.keys()).sort().reverse();

  for (const date of sortedDates) {
    const dayItems = itemsByDate.get(date) || [];
    const processedDayIds = new Set<string>();

    try {
      const groupPhotos: FeedItem[] = [];
      dayItems.forEach((item) => {
        if (item.type === "groupPhotos") {
          groupPhotos.push(item);
          processedDayIds.add(`${item.type}-${item.id}`);
        }
      });

      const groupPhotosByGroup = new Map<string, FeedItem>();
      groupPhotos.forEach((item) => {
        if (item.type === "groupPhotos" && item.data.groupId) {
          const groupId = item.data.groupId;
          if (!groupPhotosByGroup.has(groupId)) {
            groupPhotosByGroup.set(groupId, item);
          } else {
            const existingItem = groupPhotosByGroup.get(groupId)!;
            if (existingItem.type === "groupPhotos") {
              existingItem.data.photos = [
                ...(existingItem.data.photos || []),
                ...(item.data.photos || []),
              ];

              const uniquePhotos = Array.from(
                new Map(
                  existingItem.data.photos.map((photo) => [photo.id, photo]),
                ).values(),
              );
              existingItem.data.photos = uniquePhotos;
            }
          }
        }
      });

      Array.from(groupPhotosByGroup.values()).forEach((item) => {
        processedItems.push(item);
      });

      const userPhotos: FeedItem[] = [];
      dayItems.forEach((item) => {
        if (
          item.type === "userPhotos" &&
          !processedDayIds.has(`${item.type}-${item.id}`)
        ) {
          userPhotos.push(item);
          processedDayIds.add(`${item.type}-${item.id}`);
        }
      });

      const userPhotosByUser = new Map<string, FeedItem>();
      userPhotos.forEach((item) => {
        if (item.type === "userPhotos" && item.data.userId) {
          const userId = item.data.userId;
          if (!userPhotosByUser.has(userId)) {
            userPhotosByUser.set(userId, item);
          } else {
            const existingItem = userPhotosByUser.get(userId)!;
            if (existingItem.type === "userPhotos") {
              existingItem.data.photos = [
                ...(existingItem.data.photos || []),
                ...(item.data.photos || []),
              ];

              const uniquePhotos = Array.from(
                new Map(
                  existingItem.data.photos.map((photo) => [photo.id, photo]),
                ).values(),
              );
              existingItem.data.photos = uniquePhotos;
            }
          }
        }
      });

      Array.from(userPhotosByUser.values()).forEach((item) => {
        processedItems.push(item);
      });

      dayItems.forEach((item) => {
        if (
          item.type === "event" &&
          !processedDayIds.has(`${item.type}-${item.id}`)
        ) {
          processedItems.push(item);
          processedDayIds.add(`${item.type}-${item.id}`);
        }
      });

      dayItems.forEach((item) => {
        if (
          item.type === "album" &&
          !processedDayIds.has(`${item.type}-${item.id}`)
        ) {
          processedItems.push(item);
          processedDayIds.add(`${item.type}-${item.id}`);
        }
      });

      dayItems.forEach((item) => {
        if (
          item.type === "photo" &&
          !processedDayIds.has(`${item.type}-${item.id}`) &&
          !seenIds.has(`processed-${item.type}-${item.id}`)
        ) {
          let isIncluded = false;

          Array.from(groupPhotosByGroup.values()).forEach((groupItem) => {
            if (groupItem.type === "groupPhotos" && groupItem.data.photos) {
              if (groupItem.data.photos.some((photo) => photo.id === item.id)) {
                isIncluded = true;
              }
            }
          });

          Array.from(userPhotosByUser.values()).forEach((userItem) => {
            if (userItem.type === "userPhotos" && userItem.data.photos) {
              if (userItem.data.photos.some((photo) => photo.id === item.id)) {
                isIncluded = true;
              }
            }
          });

          if (!isIncluded) {
            processedItems.push(item);
            processedDayIds.add(`${item.type}-${item.id}`);
          }
        }
      });
    } catch (error) {
      console.error("Error processing items for date:", date, error);

      dayItems.forEach((item) => {
        if (!processedDayIds.has(`${item.type}-${item.id}`)) {
          processedItems.push(item);
        }
      });
    }
  }

  processedItems.sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    return dateB - dateA;
  });

  return processedItems;
}

/**
 * Helper function to extract a unique identifier for a feed item
 */
export function getFeedItemUniqueId(item: FeedItem): string {
  return `${item.type}-${item.id}`;
}
