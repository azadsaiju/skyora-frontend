"use client";

/**
 * Users admin — SUPER_ADMIN only (parent gates the view; the server also
 * 403s). Create admin accounts, reset passwords (forces change at next
 * login and kills sessions), activate/deactivate accounts. No delete —
 * deactivation is the only off-switch, and you cannot deactivate yourself.
 */

import * as React from "react";
import {
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Plus,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/client";
import type { Role, SessionUser, UserDTO } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AdminPageHeader,
  EmptyState,
  FIELD_CLASS,
  SELECT_TRIGGER_CLASS,
  TableSkeleton,
  fmtDateShort,
  toastApiError,
  validatePassword,
} from "@/components/admin/admin-ui";

const ROLES: Role[] = ["ADMIN", "SUPER_ADMIN"];

function PasswordField({
  id,
  label,
  value,
  onChange,
  show,
  onToggle,
  autoComplete,
  disabled,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  autoComplete: string;
  disabled: boolean;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="font-grotesk text-xs font-bold uppercase">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          required
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          className={`${FIELD_CLASS} pr-10`}
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={show ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-cream hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {show ? (
            <EyeOff className="size-4" aria-hidden="true" />
          ) : (
            <Eye className="size-4" aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: Role }) {
  return (
    <span
      className={cn(
        "inline-block whitespace-nowrap rounded-full border-2 border-ink px-2 py-0.5 font-grotesk text-[10px] font-bold uppercase text-white",
        role === "SUPER_ADMIN" ? "bg-brand-pink" : "bg-brand-blue"
      )}
    >
      {role === "SUPER_ADMIN" ? "Super Admin" : "Admin"}
    </span>
  );
}

function PwdFlagBadge() {
  return (
    <span className="inline-block whitespace-nowrap rounded-full border-2 border-ink bg-brand-yellow px-2 py-0.5 font-grotesk text-[10px] font-bold uppercase text-ink">
      Must change pwd
    </span>
  );
}

function ResetPasswordDialog({
  target,
  open,
  onOpenChange,
  onDone,
}: {
  target: UserDTO;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onDone: () => void;
}) {
  const [pw, setPw] = React.useState("");
  const [confirmPw, setConfirmPw] = React.useState("");
  const [show, setShow] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setPw("");
      setConfirmPw("");
      setError(null);
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving) return;
    const problem = validatePassword(pw);
    if (problem) {
      setError(`Password: ${problem}`);
      return;
    }
    if (pw !== confirmPw) {
      setError("Password and confirmation do not match.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await api<{ user: UserDTO }>(`/api/users/${target.id}`, {
        method: "PATCH",
        body: JSON.stringify({ password: pw }),
      });
      toast.success("Password reset — user must change it at next login");
      onDone();
    } catch (err) {
      toastApiError(err, "Could not reset the password.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-xl border-2 border-ink bg-white shadow-hard sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display uppercase">
            Reset Password
          </DialogTitle>
          <DialogDescription>
            Set a temporary password for <strong>{target.name}</strong> (
            {target.email}). All their current sessions are signed out and they
            must change this password at next login.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <PasswordField
            id="reset-pw"
            label="New password"
            value={pw}
            onChange={setPw}
            show={show}
            onToggle={() => setShow((v) => !v)}
            autoComplete="new-password"
            disabled={saving}
          />
          <PasswordField
            id="reset-confirm"
            label="Confirm password"
            value={confirmPw}
            onChange={setConfirmPw}
            show={show}
            onToggle={() => setShow((v) => !v)}
            autoComplete="new-password"
            disabled={saving}
          />
          <div aria-live="polite">
            {error ? (
              <p role="alert" className="text-xs font-bold text-brand-red">
                {error}
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
              className="border-2 border-ink bg-white font-grotesk font-bold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="font-grotesk font-bold uppercase shadow-hard-sm"
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <KeyRound className="size-4" aria-hidden="true" />
              )}
              Reset Password
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddUserDialog({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSaved: () => void;
}) {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState<Role>("ADMIN");
  const [show, setShow] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setName("");
      setEmail("");
      setPassword("");
      setRole("ADMIN");
      setErrors({});
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving) return;
    const errs: Record<string, string> = {};
    if (name.trim().length < 2) errs.name = "Name is required (min 2 characters).";
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) errs.email = "Enter a valid email.";
    const pwProblem = validatePassword(password);
    if (pwProblem) errs.password = `Password: ${pwProblem}`;
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    try {
      const res = await api<{ user: UserDTO }>("/api/users", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          role,
        }),
      });
      toast.success(
        `Account created — ${res.user.name} must change their password at first login.`
      );
      onSaved();
    } catch (err) {
      toastApiError(err, "Could not create the account.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-xl border-2 border-ink bg-white shadow-hard sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display uppercase">Add User</DialogTitle>
          <DialogDescription>
            Create an admin portal account. It starts with a temporary password
            that must be changed at first login.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="new-user-name" className="font-grotesk text-xs font-bold uppercase">
              Name
            </Label>
            <Input
              id="new-user-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Priya Nair"
              className={FIELD_CLASS}
              aria-invalid={!!errors.name}
            />
            {errors.name ? (
              <p className="text-xs font-bold text-brand-red">{errors.name}</p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-user-email" className="font-grotesk text-xs font-bold uppercase">
              Email
            </Label>
            <Input
              id="new-user-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@skyora.edu.in"
              className={FIELD_CLASS}
              aria-invalid={!!errors.email}
            />
            {errors.email ? (
              <p className="text-xs font-bold text-brand-red">{errors.email}</p>
            ) : null}
          </div>
          <div>
            <PasswordField
              id="new-user-pw"
              label="Temporary password"
              value={password}
              onChange={setPassword}
              show={show}
              onToggle={() => setShow((v) => !v)}
              autoComplete="new-password"
              disabled={saving}
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Min 8 characters with at least one letter and one number.
            </p>
            {errors.password ? (
              <p className="mt-1 text-xs font-bold text-brand-red">{errors.password}</p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-user-role" className="font-grotesk text-xs font-bold uppercase">
              Role
            </Label>
            <Select value={role} onValueChange={(v) => setRole(v as Role)}>
              <SelectTrigger
                id="new-user-role"
                aria-label="Account role"
                className={SELECT_TRIGGER_CLASS}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r === "SUPER_ADMIN" ? "Super Admin" : "Admin"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
              className="border-2 border-ink bg-white font-grotesk font-bold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="font-grotesk font-bold uppercase shadow-hard-sm"
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Plus className="size-4" aria-hidden="true" />
              )}
              Add User
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function UserActions({
  u,
  self,
  onResetPassword,
}: {
  u: UserDTO;
  self: boolean;
  onResetPassword: (u: UserDTO) => void;
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => onResetPassword(u)}
      disabled={self}
      title={self ? "You cannot reset your own password here — use change password" : undefined}
      className="border-2 border-ink bg-white font-grotesk font-bold"
    >
      <KeyRound className="size-3.5" aria-hidden="true" />
      Reset Password
    </Button>
  );
}

export function UsersView({ user }: { user: SessionUser }) {
  const [users, setUsers] = React.useState<UserDTO[] | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [addOpen, setAddOpen] = React.useState(false);
  const [resetTarget, setResetTarget] = React.useState<UserDTO | null>(null);
  const [togglingId, setTogglingId] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<{ users: UserDTO[] }>("/api/users");
      setUsers(res.users);
    } catch (err) {
      toastApiError(err, "Could not load users.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function handleToggleActive(u: UserDTO, isActive: boolean) {
    setTogglingId(u.id);
    try {
      const res = await api<{ user: UserDTO }>(`/api/users/${u.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive }),
      });
      setUsers((prev) =>
        prev ? prev.map((x) => (x.id === u.id ? res.user : x)) : prev
      );
      toast.success(isActive ? `${u.name} activated` : `${u.name} deactivated`);
    } catch (err) {
      // Surface server messages like "Cannot deactivate the last active super admin."
      toastApiError(err);
      void load();
    } finally {
      setTogglingId(null);
    }
  }

  const rows = users ?? [];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Users"
        description="Admin portal accounts. Deactivate instead of deleting to keep audit history intact."
      >
        <Button
          onClick={() => setAddOpen(true)}
          className="font-grotesk font-bold uppercase shadow-hard-sm"
        >
          <Plus className="size-4" aria-hidden="true" />
          Add User
        </Button>
      </AdminPageHeader>

      {loading && users === null ? (
        <TableSkeleton rows={3} />
      ) : rows.length === 0 ? (
        <div className="brutal-card">
          <EmptyState
            icon={Users}
            title="No users"
            message="Add your first admin account."
          />
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block">
            <div className="brutal-card overflow-hidden">
              <div className="nice-scrollbar overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-cream hover:bg-cream">
                      <TableHead className="font-grotesk text-xs font-bold uppercase">Name</TableHead>
                      <TableHead className="font-grotesk text-xs font-bold uppercase">Email</TableHead>
                      <TableHead className="font-grotesk text-xs font-bold uppercase">Role</TableHead>
                      <TableHead className="font-grotesk text-xs font-bold uppercase">Status</TableHead>
                      <TableHead className="font-grotesk text-xs font-bold uppercase">Password</TableHead>
                      <TableHead className="font-grotesk text-xs font-bold uppercase">Created</TableHead>
                      <TableHead className="font-grotesk text-xs font-bold uppercase">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((u) => {
                      const self = u.id === user.id;
                      return (
                        <TableRow key={u.id} className="hover:bg-cream">
                          <TableCell className="whitespace-nowrap font-bold">
                            {u.name}
                            {self ? (
                              <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                                (you)
                              </span>
                            ) : null}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">{u.email}</TableCell>
                          <TableCell>
                            <RoleBadge role={u.role} />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={u.isActive}
                                disabled={self || togglingId === u.id}
                                onCheckedChange={(checked) =>
                                  void handleToggleActive(u, checked)
                                }
                                aria-label={
                                  u.isActive
                                    ? `Deactivate ${u.name}`
                                    : `Activate ${u.name}`
                                }
                              />
                              <span className="font-grotesk text-xs font-bold uppercase text-muted-foreground">
                                {u.isActive ? "Active" : "Disabled"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {u.mustChangePassword ? (
                              <PwdFlagBadge />
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                            {fmtDateShort(u.createdAt)}
                          </TableCell>
                          <TableCell>
                            <UserActions
                              u={u}
                              self={self}
                              onResetPassword={(target) => setResetTarget(target)}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {rows.map((u) => {
              const self = u.id === user.id;
              return (
                <div key={u.id} className="brutal-card-sm p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-grotesk font-bold">
                        {u.name}
                        {self ? (
                          <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                            (you)
                          </span>
                        ) : null}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                    </div>
                    <RoleBadge role={u.role} />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {u.mustChangePassword ? <PwdFlagBadge /> : null}
                    <span className="text-xs text-muted-foreground">
                      Joined {fmtDateShort(u.createdAt)}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2 border-t-2 border-dashed border-ink/10 pt-3">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={u.isActive}
                        disabled={self || togglingId === u.id}
                        onCheckedChange={(checked) =>
                          void handleToggleActive(u, checked)
                        }
                        aria-label={
                          u.isActive ? `Deactivate ${u.name}` : `Activate ${u.name}`
                        }
                      />
                      <span className="font-grotesk text-xs font-bold uppercase text-muted-foreground">
                        {u.isActive ? "Active" : "Disabled"}
                      </span>
                    </div>
                    <UserActions
                      u={u}
                      self={self}
                      onResetPassword={(target) => setResetTarget(target)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <AddUserDialog open={addOpen} onOpenChange={setAddOpen} onSaved={() => void load()} />
      {resetTarget ? (
        <ResetPasswordDialog
          target={resetTarget}
          open
          onOpenChange={(o) => {
            if (!o) setResetTarget(null);
          }}
          onDone={() => {
            setResetTarget(null);
            void load();
          }}
        />
      ) : null}
    </div>
  );
}
