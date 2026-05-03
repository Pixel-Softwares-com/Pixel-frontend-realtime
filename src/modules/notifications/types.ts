export type RealtimeNotificationData = Record<string, unknown>;

export type RealtimeNotification = {
  id: string;
  user_id: string;
  user_type: string | null;
  type: string;
  title: string | null;
  body: string | null;
  data: RealtimeNotificationData;
  read_at: string | null;
  created_at: string | null;
};

export type NotificationEventPayload = {
  notification: RealtimeNotification;
};
