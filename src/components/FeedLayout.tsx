import React from "react";
import Masonry from "react-masonry-css";
import { PhotoCard } from "~/components/PhotoCard";
import { AlbumCard } from "~/components/AlbumCard";
import { EventCard } from "~/components/EventCard";
import { UserPhotosCard } from "~/components/UserPhotosCard";
import { GroupPhotosCard } from "~/components/GroupPhotosCard";
import type { FeedItem } from "~/types";

interface FeedLayoutProps {
  items: FeedItem[];
  onItemClick: (item: FeedItem) => void;
  onPhotoClick: (item: FeedItem, index: number) => void;
  onTagClick: (tag: string) => void;
}

export const FeedLayout: React.FC<FeedLayoutProps> = ({
  items,
  onItemClick,
  onPhotoClick,
  onTagClick,
}) => {
  const renderFeedItem = (item: FeedItem) => {
    const { type } = item;

    switch (type) {
      case "photo":
        return (
          <PhotoCard
            photo={item.data}
            onOpen={() => onItemClick(item)}
            onTagClick={onTagClick}
          />
        );
      case "album":
        return <AlbumCard album={item.data} onOpen={() => onItemClick(item)} />;
      case "event":
        return <EventCard event={item.data} onOpen={() => onItemClick(item)} />;
      case "userPhotos":
        return (
          <UserPhotosCard
            data={item.data}
            onPhotoClick={(index) => onPhotoClick(item, index)}
          />
        );
      case "groupPhotos":
        return (
          <GroupPhotosCard
            data={item.data}
            onPhotoClick={(index) => onPhotoClick(item, index)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Masonry
      breakpointCols={{
        default: 4,
        1280: 3,
        1024: 3,
        768: 2,
        640: 1,
      }}
      className="-ml-4 flex w-auto"
      columnClassName="pl-4 bg-clip-padding"
    >
      {items.map((item) => (
        <React.Fragment key={`${item.type}-${item.id}`}>
          {renderFeedItem(item)}
        </React.Fragment>
      ))}
    </Masonry>
  );
};
