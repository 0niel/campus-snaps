export interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  academicGroup?: {
    id: string;
    name: string;
  } | null;
}

export interface Photo {
  id: number;
  url: string;
  description: string | null;
  uploadDate: Date;
  userId: string;
  user: User;
  likes: { userId: string }[];
  comments: { id: number }[];
  tags: { tag: { id: number; name: string } }[];
  event?: Event | null;
}

export interface Event {
  id: number;
  name: string;
  description: string | null;
  date: Date;
  location?: string | null;
  coverImage?: string | null;
  photos: Photo[];
}

export interface AcademicGroup {
  id: number;
  name: string;
  description: string | null;
  users: User[];
}

export interface Tag {
  id: number;
  name: string;
  count?: number;
}

export interface FeedItem {
  id: number;
  type: "photo" | "event" | "group";
  data: Photo | Event | AcademicGroup;
  date: Date;
  title?: string;
  description?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor: number | undefined;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface Album {
  id: number;
  title: string;
  description: string | null;
  coverImage: string | null;
  ownerId: string | null;
  academicGroupId: number | null;
  privacy: "public" | "private" | "group" | "custom";
  photos: Photo[];
  owner?: User | null;
  academicGroup?: AcademicGroup | null;
}
