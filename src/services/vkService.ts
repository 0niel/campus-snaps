import axios from "axios";

const VK_API_VERSION = "5.131";
const VK_API_BASE_URL = "https://api.vk.com/method/";
const VK_AUTH_URL = "https://oauth.vk.com/authorize";
const VK_REDIRECT_URI =
  typeof window !== "undefined"
    ? `${window.location.origin}/api/vk/callback`
    : "";

const VK_SCOPES = "photos,groups,offline";

class VKService {
  private accessToken: string | null = null;
  private userId: string | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.accessToken = localStorage.getItem("vk_access_token");
      this.userId = localStorage.getItem("vk_user_id");
    }
  }

  /**
   * Check if user is authenticated with VK
   */
  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  /**
   * Get the authorization URL for VK OAuth
   */
  getAuthUrl(): string {
    const queryParams = new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_VK_APP_ID ?? "2274003",
      display: "popup",
      redirect_uri: VK_REDIRECT_URI,
      scope: VK_SCOPES,
      response_type: "token",
      v: VK_API_VERSION,
    });

    return `${VK_AUTH_URL}?${queryParams.toString()}`;
  }

  /**
   * Handle the access token from VK OAuth redirect
   */
  handleAuthCallback(hash: string): boolean {
    if (!hash) return false;

    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get("access_token");
    const userId = params.get("user_id");

    if (accessToken && userId) {
      this.accessToken = accessToken;
      this.userId = userId;

      if (typeof window !== "undefined") {
        localStorage.setItem("vk_access_token", accessToken);
        localStorage.setItem("vk_user_id", userId);
      }

      return true;
    }

    return false;
  }

  /**
   * Clear authentication data
   */
  logout(): void {
    this.accessToken = null;
    this.userId = null;

    if (typeof window !== "undefined") {
      localStorage.removeItem("vk_access_token");
      localStorage.removeItem("vk_user_id");
    }
  }

  /**
   * Make an API call to VK
   */
  private async apiCall<T>(
    method: string,
    params: Record<string, any> = {},
  ): Promise<T> {
    if (!this.accessToken) {
      throw new Error("Not authenticated with VK");
    }

    const url = `${VK_API_BASE_URL}${method}`;

    const requestParams = {
      ...params,
      access_token: this.accessToken,
      v: VK_API_VERSION,
    };

    try {
      const response = await axios.post(
        url,
        new URLSearchParams(requestParams),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        },
      );

      if (response.data.error) {
        throw new Error(`VK API Error: ${response.data.error.error_msg}`);
      }

      return response.data.response;
    } catch (error) {
      console.error("VK API error:", error);
      throw error;
    }
  }

  /**
   * Get user's groups/communities
   */
  async getUserGroups(): Promise<Array<{ id: string; name: string }>> {
    try {
      const response = await this.apiCall<{
        items: Array<{ id: number; name: string }>;
      }>("groups.get", {
        extended: 1,
        filter: "admin,editor",
        fields: "name",
      });

      return response.items.map((item) => ({
        id: String(item.id),
        name: item.name,
      }));
    } catch (error) {
      console.error("Error getting user groups:", error);
      return [];
    }
  }

  /**
   * Get albums for a group
   */
  async getGroupAlbums(
    groupId: string,
  ): Promise<Array<{ id: string; title: string }>> {
    try {
      const response = await this.apiCall<{
        items: Array<{ id: number; title: string }>;
      }>("photos.getAlbums", {
        owner_id: `-${groupId}`,
      });

      return response.items.map((item) => ({
        id: String(item.id),
        title: item.title,
      }));
    } catch (error) {
      console.error("Error getting group albums:", error);
      return [];
    }
  }

  /**
   * Create a new album in a group
   */
  async createAlbum(
    groupId: string,
    title: string,
    description: string,
    privacyOption: string,
  ): Promise<string | null> {
    try {
      let privacy = 0;
      if (privacyOption === "friends") privacy = 1;
      if (privacyOption === "private") privacy = 3;

      const response = await this.apiCall<{ id: number }>(
        "photos.createAlbum",
        {
          title,
          description: description || undefined,
          group_id: groupId,
          privacy_view: privacy,
          upload_by_admins_only: 1,
          comments_disabled: 0,
        },
      );

      return String(response.id);
    } catch (error) {
      console.error("Error creating album:", error);
      return null;
    }
  }

  /**
   * Get server URL for photo upload
   */
  private async getUploadServer(
    albumId: string,
    groupId: string,
  ): Promise<string | null> {
    try {
      const response = await this.apiCall<{ upload_url: string }>(
        "photos.getUploadServer",
        {
          album_id: albumId,
          group_id: groupId,
        },
      );

      return response.upload_url;
    } catch (error) {
      console.error("Error getting upload server:", error);
      return null;
    }
  }

  /**
   * Save uploaded photos
   */
  private async savePhotos(
    albumId: string,
    groupId: string,
    server: string,
    photosList: string,
    hash: string,
  ): Promise<boolean> {
    try {
      await this.apiCall("photos.save", {
        album_id: albumId,
        group_id: groupId,
        server,
        photos_list: photosList,
        hash,
      });

      return true;
    } catch (error) {
      console.error("Error saving photos:", error);
      return false;
    }
  }

  /**
   * Upload a single photo to VK
   */
  async uploadPhoto(
    albumId: string,
    groupId: string,
    photo: File,
  ): Promise<boolean> {
    try {
      const uploadUrl = await this.getUploadServer(albumId, groupId);
      if (!uploadUrl) return false;

      const formData = new FormData();
      formData.append("file1", photo);

      const uploadResponse = await axios.post(uploadUrl, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (!uploadResponse.data || uploadResponse.data.error) {
        throw new Error("Error uploading to VK server");
      }

      const { server, photos_list, hash } = uploadResponse.data;
      return await this.savePhotos(albumId, groupId, server, photos_list, hash);
    } catch (error) {
      console.error("Error during photo upload:", error);
      return false;
    }
  }

  /**
   * Upload multiple photos to VK album
   * Uploads photos one by one since VK API requires it
   */
  async uploadPhotos(
    albumId: string,
    groupId: string,
    photos: File[],
  ): Promise<number> {
    let successCount = 0;

    for (const photo of photos) {
      const success = await this.uploadPhoto(albumId, groupId, photo);
      if (success) successCount++;
    }

    return successCount;
  }
}

const vkService = new VKService();
export default vkService;
