export type User = {
  id: string;
  name: string | null;
  email?: string | null;
  image: string | null;
  academicGroup?: {
    id: number;
    name: string;
  } | null;
  academicGroupId?: number | null;
  _count?: {
    photos: number;
    events?: number;
    likes?: number;
    comments?: number;
  };
};

export type Photo = {
  id: number;
  url: string;
  description: string | null;
  uploadDate: Date;
  userId: string;
  user: User;
  likes: { userId: string; user?: User }[];
  comments: {
    id: number;
    content: string;
    createdAt: Date;
    userId: string;
    user: User;
  }[];
  tags: {
    tag: {
      id: number;
      name: string;
    };
  }[];
  albumId?: number | null;
  academicGroupId?: number | null;
  locationId?: number | null;
  location?: {
    id: number;
    name: string;
    description?: string | null;
  } | null;
  eventId?: number | null;
  event?: Event | null;
};

export type Album = {
  id: number;
  title: string;
  description: string | null;
  createdAt: Date;
  userId: string;
  user: User;
  photoCount: number;
  photos?: {
    photo: Photo;
  }[];
};

export type Group = {
  id: number;
  name: string;
  description: string | null;
  photoCount?: number;
  coverImage?: string | null;
  _count?: {
    photos?: number;
    users?: number;
    events?: number;
  };
  members?: User[];
  recentPhotos?: Photo[];
  photos?: Photo[];
  tags?: string[];
  activeCount?: number;
};

export type Event = {
  id: number;
  title: string;
  description: string | null;
  date: Date;
  location: string | null;
  organizerId: string;
  organizer: User;
  coverImage: string | null;
  featured?: boolean;
  _count?: {
    photos?: number;
    attendees?: number;
  };
  photos?: Photo[];
};

export type FeedItemType =
  | "photo"
  | "album"
  | "event"
  | "userPhotos"
  | "groupPhotos"
  | "dateHeading";

export type FeedItem = {
  id: number;
  type: FeedItemType;
  data: Photo | Album | Event | UserPhotos | GroupPhotos | DateHeading;
  date: Date;
  title?: string;
};

export type DateHeading = {
  date: Date;
  formatted: string;
};

export type UserPhotos = {
  user: User;
  photos: Photo[];
};

export type GroupPhotos = {
  group: Group;
  photos: Photo[];
};

export type FeedResult = {
  items: FeedItem[];
  nextCursor?: number;
};
