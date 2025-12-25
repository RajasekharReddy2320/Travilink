import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useConnectionActions } from "@/hooks/useConnectionActions";
import { UserPlus, UserCheck, Clock } from "lucide-react";

interface ConnectButtonProps {
  userId: string;
  currentUserId: string;
}

export const ConnectButton = ({ userId, currentUserId }: ConnectButtonProps) => {
  const [connectionStatus, setConnectionStatus] = useState<string>("none");
  const [loading, setLoading] = useState(true);
  const { sendConnectionRequest, cancelConnectionRequest } = useConnectionActions();

  useEffect(() => {
    checkConnectionStatus();
  }, [userId, currentUserId]);

  const checkConnectionStatus = async () => {
    try {
      const { data } = await supabase.rpc("get_connection_status", {
        user1_id: currentUserId,
        user2_id: userId,
      });
      setConnectionStatus(data || "none");
    } catch (error) {
      console.error("Error checking connection status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    const success = await sendConnectionRequest(currentUserId, userId);
    if (success) {
      setConnectionStatus("pending_sent");
    }
  };

  const handleCancelRequest = async () => {
    const success = await cancelConnectionRequest(currentUserId, userId);
    if (success) {
      setConnectionStatus("none");
    }
  };

  if (loading) return null;

  switch (connectionStatus) {
    case "connected":
      return (
        <Button variant="outline" size="sm" disabled>
          <UserCheck className="h-4 w-4 mr-1" />
          Connected
        </Button>
      );
    case "pending_sent":
      return (
        <Button variant="outline" size="sm" onClick={handleCancelRequest}>
          <Clock className="h-4 w-4 mr-1" />
          Cancel
        </Button>
      );
    case "pending_received":
      return (
        <Button variant="outline" size="sm" disabled>
          <Clock className="h-4 w-4 mr-1" />
          Request Received
        </Button>
      );
    default:
      return (
        <Button size="sm" onClick={handleConnect}>
          <UserPlus className="h-4 w-4 mr-1" />
          Connect
        </Button>
      );
  }
};
