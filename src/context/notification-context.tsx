
"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Button } from '@/components/ui/button';

export interface Notification {
  id: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}

type NewNotification = Omit<Notification, 'id'>;

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: NewNotification) => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (notification: NewNotification) => {
    const newNotification = { ...notification, id: `notif-${Date.now()}` };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, clearNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
