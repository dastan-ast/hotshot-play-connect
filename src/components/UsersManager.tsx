import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Ban, Search, ShieldCheck, Unlock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { listAllUsers, setUserBlocked, setUserRole, type ManagedUser } from "@/lib/users.functions";

const ROLE_LABEL: Record<string, string> = {
  player: "Игрок", club_admin: "Персонал клуба", owner: "Владелец клуба", moderator: "Модератор", admin: "Суперадмин",
};

export function UsersManager() {
  const list = useServerFn(listAllUsers);
  const changeRole = useServerFn(setUserRole);
  const block = useServerFn(setUserBlocked);
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ["admin-users"], queryFn: () => list() });
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [busy, setBusy] = useState<string | null>(null);

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return data.filter((u) =>
      (roleFilter === "all" || (roleFilter === "blocked" ? u.blocked : u.role === roleFilter)) &&
      (!s || [u.name, u.email, u.phone].some((v) => v?.toLowerCase().includes(s))),
    );
  }, [data, q, roleFilter]);

  async function run(u: ManagedUser, fn: () => Promise<unknown>, ok: string) {
    setBusy(u.id);
    try { await fn(); toast.success(ok); await qc.invalidateQueries({ queryKey: ["admin-users"] }); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Ошибка"); }
    finally { setBusy(null); }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Имя, почта или телефон" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[190px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все роли</SelectItem>
            {Object.entries(ROLE_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            <SelectItem value="blocked">Заблокированные</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <p className="text-xs text-muted-foreground">Найдено: {rows.length} из {data.length}</p>

      <div className="neon-panel overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="p-3">Пользователь</th><th className="p-3">Телефон</th>
              <th className="p-3">Роль</th><th className="p-3">Статус</th><th className="p-3 text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Загрузка…</td></tr>}
            {!isLoading && rows.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Никого не найдено</td></tr>}
            {rows.map((u) => {
              const locked = u.role === "admin";
              return (
                <tr key={u.id} className="border-b border-border/50 last:border-0">
                  <td className="p-3"><div className="font-medium">{u.name || "—"}</div><div className="text-xs text-muted-foreground">{u.email}</div></td>
                  <td className="p-3 text-muted-foreground">{u.phone || "—"}</td>
                  <td className="p-3">
                    {locked ? (
                      <Badge><ShieldCheck className="mr-1 size-3" />Суперадмин</Badge>
                    ) : (
                      <Select value={u.role} disabled={busy === u.id}
                        onValueChange={(role) => run(u, () => changeRole({ data: { userId: u.id, role } }), `Роль: ${ROLE_LABEL[role]}`)}>
                        <SelectTrigger className="h-8 w-[170px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {(["player", "club_admin", "owner", "moderator"] as const).map((r) => <SelectItem key={r} value={r}>{ROLE_LABEL[r]}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                  </td>
                  <td className="p-3">{u.blocked ? <Badge variant="destructive">Заблокирован</Badge> : <Badge variant="secondary">Активен</Badge>}</td>
                  <td className="p-3 text-right">
                    {!locked && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant={u.blocked ? "outline" : "destructive"} disabled={busy === u.id}>
                            {u.blocked ? <><Unlock className="mr-1 size-4" />Разблокировать</> : <><Ban className="mr-1 size-4" />Заблокировать</>}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{u.blocked ? "Разблокировать" : "Заблокировать"} {u.name || u.email}?</AlertDialogTitle>
                            <AlertDialogDescription>
                              {u.blocked ? "Пользователь снова сможет входить на сайт." : "Пользователь не сможет войти, пока вы его не разблокируете."}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Отмена</AlertDialogCancel>
                            <AlertDialogAction onClick={() => run(u, () => block({ data: { userId: u.id, blocked: !u.blocked } }), u.blocked ? "Разблокирован" : "Заблокирован")}>
                              Подтвердить
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
