import { useState } from "react";
import { Layout, SectionHeader } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  Search,
  Trash2,
  Mail,
  ShieldAlert,
  Loader2,
  RefreshCw,
  User,
  Clock,
  CheckCircle,
  AlertTriangle,
  Send,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, supabaseAdmin } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface AppUser {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
}

async function fetchUsers(): Promise<AppUser[]> {
  if (!supabaseAdmin) throw new Error("Admin client not configured");
  const { data, error } = await supabaseAdmin.auth.admin.listUsers();
  if (error) throw error;
  return data.users.map((u) => ({
    id: u.id,
    email: u.email ?? "",
    full_name: u.user_metadata?.full_name ?? u.email?.split("@")[0] ?? "—",
    created_at: u.created_at,
    last_sign_in_at: u.last_sign_in_at ?? null,
    email_confirmed_at: u.email_confirmed_at ?? null,
  }));
}

type DeleteStep = "idle" | "confirm" | "otp-sent" | "otp-verify" | "deleting" | "done";

export default function UsersPage() {
  const { user: adminUser } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [deleteStep, setDeleteStep] = useState<DeleteStep>("idle");
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { data: users = [], isLoading, error, refetch } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
    enabled: !!supabaseAdmin,
  });

  const filtered = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.full_name.toLowerCase().includes(search.toLowerCase())
  );

  const openDeleteDialog = (user: AppUser) => {
    setSelectedUser(user);
    setDeleteStep("confirm");
    setOtpCode("");
    setOtpError(null);
    setDeleteError(null);
  };

  const closeDeleteDialog = () => {
    setSelectedUser(null);
    setDeleteStep("idle");
    setOtpCode("");
    setOtpError(null);
    setDeleteError(null);
  };

  const sendOtp = async () => {
    if (!adminUser?.email) return;
    setDeleteStep("otp-sent");
    setOtpError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email: adminUser.email,
      options: { shouldCreateUser: false },
    });
    if (error) {
      setOtpError(error.message ?? "Failed to send OTP. Please try again.");
      setDeleteStep("confirm");
    }
  };

  const verifyOtpAndDelete = async () => {
    if (!adminUser?.email || !selectedUser || !otpCode.trim()) return;
    setDeleteStep("otp-verify");
    setOtpError(null);

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: adminUser.email,
      token: otpCode.trim(),
      type: "email",
    });

    if (verifyError) {
      setOtpError("Invalid or expired code. Please try again.");
      setDeleteStep("otp-sent");
      return;
    }

    setDeleteStep("deleting");
    try {
      if (!supabaseAdmin) throw new Error("Admin client not configured");

      await supabaseAdmin.auth.admin.deleteUser(selectedUser.id);

      await supabase.from("deleted_users").insert({
        user_id: selectedUser.id,
        user_email: selectedUser.email,
        user_name: selectedUser.full_name,
        deleted_by: adminUser.id,
        deleted_by_email: adminUser.email,
      });

      setDeleteStep("done");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({
        title: "User deleted",
        description: `${selectedUser.email} has been permanently deleted.`,
      });
    } catch (err: any) {
      setDeleteError(err.message ?? "Failed to delete user.");
      setDeleteStep("otp-sent");
    }
  };

  const noAdminClient = !supabaseAdmin;

  return (
    <Layout breadcrumbs={[{ label: "Users" }]}>
      <SectionHeader
        title="User Management"
        description="View and manage all registered EduPress users"
        action={
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      />

      {noAdminClient && (
        <Alert className="mb-4 border-amber-200 bg-amber-50">
          <ShieldAlert className="w-4 h-4 text-amber-600" />
          <AlertDescription className="text-amber-700">
            <strong>Service role key not configured.</strong> Add{" "}
            <code className="bg-amber-100 px-1 rounded text-xs">VITE_SUPABASE_SERVICE_KEY</code> to
            your <code className="bg-amber-100 px-1 rounded text-xs">.env</code> file to enable user
            management. See the README for setup instructions.
          </AlertDescription>
        </Alert>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
              <Users className="w-4.5 h-4.5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold leading-none">{users.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Total Users</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center">
              <CheckCircle className="w-4.5 h-4.5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold leading-none">
                {users.filter((u) => u.email_confirmed_at).length}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Verified</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
              <AlertTriangle className="w-4.5 h-4.5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold leading-none">
                {users.filter((u) => !u.email_confirmed_at).length}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Unverified</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Last Sign In</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Loading users...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2 text-destructive">
                    <ShieldAlert className="w-5 h-5" />
                    <p className="text-sm">Failed to load users. Check service role key.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <Users className="w-5 h-5 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {search ? "No users match your search" : "No users found"}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{u.full_name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {u.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {u.email_confirmed_at ? (
                      <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(u.created_at).toLocaleDateString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {u.last_sign_in_at
                        ? new Date(u.last_sign_in_at).toLocaleDateString()
                        : "Never"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                      onClick={() => openDeleteDialog(u)}
                      disabled={u.id === adminUser?.id}
                      title={u.id === adminUser?.id ? "Cannot delete your own account" : "Delete user"}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Delete Dialog */}
      <Dialog open={deleteStep !== "idle"} onOpenChange={(o) => !o && closeDeleteDialog()}>
        <DialogContent className="sm:max-w-md">
          {deleteStep === "confirm" && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-destructive">
                  <Trash2 className="w-5 h-5" />
                  Delete User
                </DialogTitle>
                <DialogDescription>
                  You are about to permanently delete this user account. This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-destructive/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-destructive" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{selectedUser?.full_name}</p>
                      <p className="text-xs text-muted-foreground">{selectedUser?.email}</p>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-3">
                  To confirm, we'll send a 6-digit verification code to your admin email:{" "}
                  <strong>{adminUser?.email}</strong>
                </p>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={closeDeleteDialog}>Cancel</Button>
                <Button variant="destructive" onClick={sendOtp}>
                  <Send className="w-4 h-4 mr-2" />
                  Send Verification Code
                </Button>
              </DialogFooter>
            </>
          )}

          {(deleteStep === "otp-sent" || deleteStep === "otp-verify") && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-blue-600" />
                  Enter Verification Code
                </DialogTitle>
                <DialogDescription>
                  We sent a 6-digit code to <strong>{adminUser?.email}</strong>. Enter it below to confirm deletion.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                {otpError && (
                  <Alert variant="destructive">
                    <AlertDescription>{otpError}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label>Verification Code</Label>
                  <Input
                    placeholder="Enter 6-digit code"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="text-center text-2xl font-mono tracking-widest"
                    maxLength={6}
                    autoFocus
                    disabled={deleteStep === "otp-verify"}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Didn't receive the code?{" "}
                  <button
                    className="text-primary underline"
                    onClick={sendOtp}
                    disabled={deleteStep === "otp-verify"}
                  >
                    Resend
                  </button>
                </p>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={closeDeleteDialog} disabled={deleteStep === "otp-verify"}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={verifyOtpAndDelete}
                  disabled={otpCode.length !== 6 || deleteStep === "otp-verify"}
                >
                  {deleteStep === "otp-verify" ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Verifying...</>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Confirm Delete
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}

          {deleteStep === "deleting" && (
            <div className="py-12 flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-destructive" />
              <p className="text-sm text-muted-foreground">Deleting user account...</p>
            </div>
          )}

          {deleteStep === "done" && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="w-5 h-5" />
                  User Deleted
                </DialogTitle>
              </DialogHeader>
              <div className="py-4 text-center">
                <p className="text-sm text-muted-foreground">
                  The user account has been permanently deleted and logged in the audit trail.
                </p>
              </div>
              <DialogFooter>
                <Button onClick={closeDeleteDialog} className="w-full">Done</Button>
              </DialogFooter>
            </>
          )}

          {deleteError && (
            <Alert variant="destructive" className="mt-2">
              <AlertDescription>{deleteError}</AlertDescription>
            </Alert>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
