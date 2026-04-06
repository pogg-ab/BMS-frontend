// Lightweight real-time notification system
// Uses efficient polling instead of Firebase to keep the bundle small.
// If you want to add Firebase later, install it and replace this file.

export const requestForToken = async (): Promise<string | null> => {
  // Push notifications require Firebase configuration.
  // For now, real-time sync is handled via efficient polling in NotificationContext.
  console.log('[Notifications] Using polling mode for real-time sync.');
  return null;
};

export const onMessageListener = (): Promise<any> =>
  new Promise(() => {
    // No-op: polling handles real-time updates
  });
