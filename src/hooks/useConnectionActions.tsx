import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const useConnectionActions = () => {
  const { toast } = useToast();

  const sendConnectionRequest = async (currentUserId: string, targetUserId: string) => {
    const { error } = await supabase
      .from("user_connections")
      .insert({
        requester_id: currentUserId,
        addressee_id: targetUserId,
        status: "pending"
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to send connection request",
        variant: "destructive"
      });
      return false;
    }

    toast({
      title: "Request Sent",
      description: "Connection request sent successfully"
    });
    return true;
  };

  const cancelConnectionRequest = async (currentUserId: string, targetUserId: string) => {
    const { error } = await supabase
      .from("user_connections")
      .delete()
      .eq("requester_id", currentUserId)
      .eq("addressee_id", targetUserId)
      .eq("status", "pending");

    if (error) {
      toast({
        title: "Error",
        description: "Failed to cancel request",
        variant: "destructive"
      });
      return false;
    }

    toast({
      title: "Request Cancelled",
      description: "Connection request cancelled"
    });
    return true;
  };

  const removeConnection = async (currentUserId: string, targetUserId: string) => {
    const { error } = await supabase
      .from("user_connections")
      .delete()
      .or(`and(requester_id.eq.${currentUserId},addressee_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},addressee_id.eq.${currentUserId})`)
      .eq("status", "accepted");

    if (error) {
      toast({
        title: "Error",
        description: "Failed to remove connection",
        variant: "destructive"
      });
      return false;
    }

    toast({
      title: "Connection Removed",
      description: "User removed from your connections"
    });
    return true;
  };

  return {
    sendConnectionRequest,
    cancelConnectionRequest,
    removeConnection
  };
};
