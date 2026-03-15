
"use client";

import { Bell, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/context/notification-context";
import { Badge } from "@/components/ui/badge";

export function NotificationBell() {
  const { notifications, clearNotifications } = useNotifications();
  const unreadCount = notifications.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-white hover:text-white/90 relative">
          <Bell className="h-5 w-5 sm:h-6 sm:w-6" />
          {unreadCount > 0 && (
            <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 justify-center p-0 text-xs">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>
            <div className="flex justify-between items-center">
                <span>Notifications</span>
                 {notifications.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearNotifications} className="text-xs font-normal">
                        <Trash2 className="h-3 w-3 mr-1"/> Clear all
                    </Button>
                )}
            </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <DropdownMenuItem key={notification.id} className="flex flex-col items-start gap-1 whitespace-normal">
              <p className="font-semibold">{notification.title}</p>
              <p className="text-xs text-muted-foreground">{notification.description}</p>
              {notification.action && <div className="mt-1">{notification.action}</div>}
            </DropdownMenuItem>
          ))
        ) : (
          <div className="p-4 text-center text-sm text-muted-foreground">
            You have no new notifications.
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
