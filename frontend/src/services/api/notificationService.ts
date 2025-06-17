import { api } from './apiClient';
import { API_CONFIG, buildUrl } from '@/config/api.config';
import type {
  NotificationDto,
  NotificationPreferencesDto,
  PaginatedResponse
} from './types';

class NotificationService {
  async getNotifications(
    filters: {
      type?: string;
      read?: boolean;
      page?: number;
      size?: number;
    } = {}
  ): Promise<PaginatedResponse<NotificationDto>> {
    const { page = 0, size = 20, ...params } = filters;
    return api.get<PaginatedResponse<NotificationDto>>(
      API_CONFIG.endpoints.notifications.list,
      {
        params: { ...params, page, size }
      }
    );
  }

  async markAsRead(notificationId: string): Promise<void> {
    return api.patch(
      buildUrl(API_CONFIG.endpoints.notifications.markRead, { notificationId })
    );
  }

  async markAllAsRead(): Promise<void> {
    return api.patch(API_CONFIG.endpoints.notifications.markAllRead);
  }

  async getPreferences(): Promise<NotificationPreferencesDto> {
    return api.get<NotificationPreferencesDto>(
      API_CONFIG.endpoints.notifications.preferences
    );
  }

  async updatePreferences(
    preferences: Partial<NotificationPreferencesDto>
  ): Promise<NotificationPreferencesDto> {
    return api.patch<NotificationPreferencesDto>(
      API_CONFIG.endpoints.notifications.preferences,
      preferences
    );
  }

  async getUnreadCount(): Promise<number> {
    const response = await api.get<{ count: number }>(
      `${API_CONFIG.endpoints.notifications.list}/unread-count`
    );
    return response.count;
  }

  // WebSocket subscription for real-time notifications
  subscribeToNotifications(
    userId: string,
    onNotification: (notification: NotificationDto) => void
  ): () => void {
    const ws = new WebSocket(`${API_CONFIG.baseURL.replace('http', 'ws')}/ws/notifications/${userId}`);
    
    ws.onmessage = (event) => {
      try {
        const notification = JSON.parse(event.data) as NotificationDto;
        onNotification(notification);
      } catch (error) {
        console.error('Failed to parse notification:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    // Return cleanup function
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }
}

export const notificationService = new NotificationService();