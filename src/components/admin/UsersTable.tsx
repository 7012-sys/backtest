import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Crown, User as UserIcon, Download, Ban, Trash2, ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import { exportToCsv } from "@/lib/exportCsv";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface UserWithSubscription {
  id: string;
  user_id: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
  subscription?: {
    plan: string;
    status: string;
  };
  role?: string;
}

interface UsersTableProps {
  users: UserWithSubscription[];
  loading: boolean;
  onRefresh?: () => void;
}

export const UsersTable = ({ users, loading, onRefresh }: UsersTableProps) => {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ userId: string; name: string } | null>(null);

  const handleUserAction = async (userId: string, action: "disable" | "enable" | "delete") => {
    setActionLoading(userId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("admin-delete-user", {
        body: { userId, action },
      });

      if (res.error) throw new Error(res.error.message);

      const labels = { disable: "disabled", enable: "enabled", delete: "permanently deleted" };
      toast.success(`User ${labels[action]}`);
      onRefresh?.();
    } catch (err: any) {
      toast.error(err.message || "Action failed");
    } finally {
      setActionLoading(null);
      setDeleteConfirm(null);
    }
  };

  const getPlanBadge = (plan?: string) => {
    if (plan === "pro") {
      return (
        <Badge className="bg-accent text-accent-foreground text-xs">
          <Crown className="h-3 w-3 mr-1" /> Pro
        </Badge>
      );
    }
    return <Badge variant="secondary" className="text-xs">Free</Badge>;
  };

  const getRoleBadge = (role?: string) => {
    if (role === "admin") {
      return <Badge className="bg-primary text-primary-foreground text-xs">Admin</Badge>;
    }
    return null;
  };

  const handleExport = () => {
    if (users.length === 0) {
      toast.error("No data to export");
      return;
    }
    const exportData = users.map((user) => ({
      display_name: user.display_name || "",
      email: user.email || "",
      phone: user.phone || "",
      plan: user.subscription?.plan || "free",
      role: user.role || "user",
      joined: format(new Date(user.created_at), "yyyy-MM-dd"),
    }));
    exportToCsv(exportData, `users_${format(new Date(), "yyyy-MM-dd")}`);
    toast.success("Users exported");
  };

  if (loading) {
    return <div className="text-center text-muted-foreground py-8">Loading users...</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>

      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <UserIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-sm truncate">
                            {user.email || user.display_name || "No name"}
                          </span>
                          {getRoleBadge(user.role)}
                        </div>
                        {user.phone && (
                          <span className="text-xs text-muted-foreground">{user.phone}</span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getPlanBadge(user.subscription?.plan)}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(user.created_at), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    {user.role !== "admin" && (
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-warning"
                          disabled={actionLoading === user.user_id}
                          onClick={() => handleUserAction(user.user_id, "disable")}
                          title="Disable user"
                        >
                          <Ban className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-success"
                          disabled={actionLoading === user.user_id}
                          onClick={() => handleUserAction(user.user_id, "enable")}
                          title="Enable user"
                        >
                          <ShieldCheck className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          disabled={actionLoading === user.user_id}
                          onClick={() => setDeleteConfirm({ userId: user.user_id, name: user.email || user.display_name || "this user" })}
                          title="Delete permanently"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently delete user?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteConfirm?.name}</strong> and all their data (strategies, backtests, files). This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteConfirm && handleUserAction(deleteConfirm.userId, "delete")}
            >
              Delete permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
