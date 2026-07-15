"use client";
/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  BookOpenCheck,
  CreditCard,
  FileClock,
  Loader2,
  Plane,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserCog,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import type { AdminUser, AuditEntry, Booking, Payment } from "@/types";
type Tab = "overview" | "users" | "flights" | "bookings" | "payments" | "audit";
type Overview = {
  users: number;
  blocked: number;
  pendingFlights: number;
  bookings: number;
  revenue: number;
  pendingPayments: number;
  audits: number;
};
type AdminFlight = {
  _id: string;
  airlineName: string;
  flightNumber: string;
  departureAirport: string;
  destinationAirport: string;
  departureDate: string;
  status: string;
  approvalNote?: string;
  createdBy?: { name: string; email: string };
};
const tabs: [Tab, string, typeof Activity][] = [
  ["overview", "Overview", Activity],
  ["users", "Users", Users],
  ["flights", "Flight approvals", Plane],
  ["bookings", "Bookings", BookOpenCheck],
  ["payments", "Payments", CreditCard],
  ["audit", "Audit log", FileClock],
];
export default function AdminConsole() {
  const [tab, setTab] = useState<Tab>("overview");
  const [data, setData] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const path = tab === "audit" ? "audit-logs" : tab;
      const response = await fetch(`/api/admin/${path}`, { cache: "no-store" });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.message || "Could not load admin data");
      setData(result?.data ?? (tab === "overview" ? {} : []));
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "Could not load admin data";
      setError(message);
      setData(tab === "overview" ? {} : []);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [tab]);
  useEffect(() => {
    load();
  }, [load]);
  function selectTab(nextTab: Tab) {
    if (nextTab === tab) return;
    setLoading(true);
    setError("");
    setData(null);
    setTab(nextTab);
  }
  async function mutate(path: string, method = "PATCH", body?: object) {
    setBusy(path);
    try {
      const response = await fetch(`/api/admin/${path}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.message || "Action failed");
      toast.success(result?.message || "Action completed");
      await load();
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Action failed");
    } finally {
      setBusy("");
    }
  }
  return (
    <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
      <aside className="card h-fit p-3 lg:sticky lg:top-24">
        <div className="mb-3 flex items-center gap-3 rounded-xl bg-slate-950 p-4 text-white">
          <ShieldCheck className="text-blue-400" />
          <div>
            <b>Admin Center</b>
            <p className="text-xs text-slate-400">Full system control</p>
          </div>
        </div>
        {tabs.map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => selectTab(id)}
            className={`mb-1 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold ${tab === id ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </aside>
      <section>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black capitalize">
              {tabs.find((x) => x[0] === tab)?.[1]}
            </h2>
            <p className="text-sm text-slate-500">
              Manage live FlightOps operational data.
            </p>
          </div>
          <button
            onClick={load}
            className="btn btn-secondary !p-3"
            aria-label="Refresh"
          >
            <RefreshCw size={18} />
          </button>
        </div>
        {loading ? (
          <div className="card grid min-h-72 place-items-center">
            <Loader2 className="animate-spin text-blue-600" />
          </div>
        ) : error ? (
          <div className="card grid min-h-72 place-items-center p-8 text-center">
            <div>
              <h3 className="font-black">This section could not load</h3>
              <p className="muted mt-2 text-sm">{error}</p>
              <button onClick={load} className="btn btn-primary mt-5">
                <RefreshCw size={17} /> Try again
              </button>
            </div>
          </div>
        ) : (
          <Panel tab={tab} data={data} busy={busy} mutate={mutate} />
        )}
      </section>
    </div>
  );
}
function Panel({
  tab,
  data,
  busy,
  mutate,
}: {
  tab: Tab;
  data: unknown;
  busy: string;
  mutate: (p: string, m?: string, b?: object) => Promise<void>;
}) {
  const list = Array.isArray(data) ? data : [];
  if (tab === "overview") return <OverviewPanel data={data as Overview} />;
  if (tab === "users")
    return (
      <UsersPanel
        data={list as AdminUser[]}
        busy={busy}
        mutate={mutate}
      />
    );
  if (tab === "flights")
    return (
      <FlightsPanel
        data={list as AdminFlight[]}
        busy={busy}
        mutate={mutate}
      />
    );
  if (tab === "bookings")
    return (
      <BookingsPanel
        data={list as Booking[]}
        busy={busy}
        mutate={mutate}
      />
    );
  if (tab === "payments")
    return (
      <PaymentsPanel
        data={list as Payment[]}
        busy={busy}
        mutate={mutate}
      />
    );
  return <AuditPanel data={list as AuditEntry[]} />;
}
function OverviewPanel({ data }: { data: Overview }) {
  const safe = data || ({} as Overview);
  const cards = [
    [UserCog, "Registered users", safe.users || 0],
    [Users, "Blocked users", safe.blocked || 0],
    [Plane, "Pending flights", safe.pendingFlights || 0],
    [BookOpenCheck, "Total bookings", safe.bookings || 0],
    [CreditCard, "Paid revenue", `$${(safe.revenue || 0).toLocaleString()}`],
    [Activity, "Pending payments", safe.pendingPayments || 0],
    [FileClock, "Audit events", safe.audits || 0],
  ] as const;
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map(([Icon, label, value]) => (
        <div className="card p-5" key={label}>
          <span className="grid size-11 place-items-center rounded-xl bg-blue-50 text-blue-600">
            <Icon size={20} />
          </span>
          <div className="mt-5 text-3xl font-black">{value}</div>
          <p className="text-sm text-slate-500">{label}</p>
        </div>
      ))}
    </div>
  );
}
function UsersPanel({
  data,
  busy,
  mutate,
}: {
  data: AdminUser[];
  busy: string;
  mutate: (p: string, m?: string, b?: object) => Promise<void>;
}) {
  return (
    <DataShell empty={!data.length} label="No registered users yet">
      <table className="admin-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Role</th>
            <th>Status</th>
            <th>Joined</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((u) => (
            <tr key={u._id}>
              <td>
                <b>{u.name}</b>
                <small>{u.email}</small>
              </td>
              <td>
                <select
                  value={u.role}
                  onChange={(e) =>
                    mutate(`users/${u._id}`, "PATCH", { role: e.target.value })
                  }
                  disabled={busy.includes(u._id)}
                  className="mini-select"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </td>
              <td>
                <Status value={u.isBlocked ? "blocked" : "active"} />
              </td>
              <td>{new Date(u.createdAt).toLocaleDateString()}</td>
              <td>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      mutate(`users/${u._id}`, "PATCH", {
                        isBlocked: !u.isBlocked,
                      })
                    }
                    className="action-btn"
                  >
                    {u.isBlocked ? "Unblock" : "Block"}
                  </button>
                  <button
                    aria-label="Delete user"
                    onClick={() =>
                      confirm(`Delete ${u.email}?`) &&
                      mutate(`users/${u._id}`, "DELETE")
                    }
                    className="action-btn !text-red-600"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </DataShell>
  );
}
function FlightsPanel({
  data,
  busy,
  mutate,
}: {
  data: AdminFlight[];
  busy: string;
  mutate: (p: string, m?: string, b?: object) => Promise<void>;
}) {
  return (
    <DataShell empty={!data.length} label="No database flight submissions yet">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Flight</th>
            <th>Route</th>
            <th>Owner</th>
            <th>Status</th>
            <th>Decision</th>
          </tr>
        </thead>
        <tbody>
          {data.map((f) => (
            <tr key={f._id}>
              <td>
                <b>{f.flightNumber}</b>
                <small>{f.airlineName}</small>
              </td>
              <td>
                {f.departureAirport} → {f.destinationAirport}
                <small>{f.departureDate}</small>
              </td>
              <td>
                {f.createdBy?.name || "Unknown"}
                <small>{f.createdBy?.email}</small>
              </td>
              <td>
                <Status value={f.status} />
              </td>
              <td>
                <div className="flex gap-2">
                  <button
                    disabled={busy.includes(f._id)}
                    onClick={() =>
                      mutate(`flights/${f._id}`, "PATCH", {
                        status: "approved",
                        approvalNote: "Approved by operations",
                      })
                    }
                    className="action-btn !text-emerald-700"
                  >
                    Approve
                  </button>
                  <button
                    disabled={busy.includes(f._id)}
                    onClick={() =>
                      mutate(`flights/${f._id}`, "PATCH", {
                        status: "rejected",
                        approvalNote: "Requires operational review",
                      })
                    }
                    className="action-btn !text-red-600"
                  >
                    Reject
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </DataShell>
  );
}
function BookingsPanel({
  data,
  busy,
  mutate,
}: {
  data: Booking[];
  busy: string;
  mutate: (p: string, m?: string, b?: object) => Promise<void>;
}) {
  return (
    <DataShell empty={!data.length} label="No bookings recorded yet">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Booking</th>
            <th>Passenger</th>
            <th>Flight</th>
            <th>Amount</th>
            <th>Payment</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {data.map((b) => (
            <tr key={b._id}>
              <td>
                <b>{b.bookingNumber}</b>
                <small>{new Date(b.createdAt).toLocaleDateString()}</small>
              </td>
              <td>
                {b.passengerName}
                <small>{b.passengerEmail}</small>
              </td>
              <td>
                {b.flightNumber}
                <small>{b.route}</small>
              </td>
              <td>${b.totalAmount}</td>
              <td>
                <Status value={b.paymentStatus} />
              </td>
              <td>
                <select
                  disabled={busy.includes(b._id)}
                  value={b.status}
                  onChange={(e) =>
                    mutate(`bookings/${b._id}`, "PATCH", {
                      status: e.target.value,
                    })
                  }
                  className="mini-select"
                >
                  <option>pending</option>
                  <option>confirmed</option>
                  <option>cancelled</option>
                  <option>completed</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </DataShell>
  );
}
function PaymentsPanel({
  data,
  busy,
  mutate,
}: {
  data: Payment[];
  busy: string;
  mutate: (p: string, m?: string, b?: object) => Promise<void>;
}) {
  return (
    <DataShell empty={!data.length} label="No payment records yet">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Transaction</th>
            <th>Booking</th>
            <th>Customer</th>
            <th>Amount</th>
            <th>Method</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {data.map((p) => (
            <tr key={p._id}>
              <td>
                <b>{p.transactionId}</b>
                <small>{new Date(p.createdAt).toLocaleDateString()}</small>
              </td>
              <td>{p.bookingNumber}</td>
              <td>{p.customerEmail}</td>
              <td>
                <b>${p.amount}</b>
              </td>
              <td className="capitalize">{p.method}</td>
              <td>
                <select
                  disabled={busy.includes(p._id)}
                  value={p.status}
                  onChange={(e) =>
                    mutate(`payments/${p._id}`, "PATCH", {
                      status: e.target.value,
                    })
                  }
                  className="mini-select"
                >
                  <option>pending</option>
                  <option>paid</option>
                  <option>refunded</option>
                  <option>failed</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </DataShell>
  );
}
function AuditPanel({ data }: { data: AuditEntry[] }) {
  return (
    <DataShell
      empty={!data.length}
      label="No administrative actions recorded yet"
    >
      <div className="space-y-3 p-4">
        {data.map((a) => (
          <div className="flex gap-4 rounded-xl border p-4" key={a._id}>
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-100">
              <FileClock size={18} />
            </span>
            <div>
              <div className="flex flex-wrap gap-2">
                <b>{a.action.replaceAll("_", " ")}</b>
                <Status value={a.resource} />
              </div>
              <p className="mt-1 text-sm text-slate-600">{a.details}</p>
              <small className="mt-2 block text-slate-400">
                {a.actorName} · {a.actorEmail} ·{" "}
                {new Date(a.createdAt).toLocaleString()}
              </small>
            </div>
          </div>
        ))}
      </div>
    </DataShell>
  );
}
function DataShell({
  empty,
  label,
  children,
}: {
  empty: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card overflow-auto">
      {empty ? (
        <div className="grid min-h-72 place-items-center p-8 text-center">
          <div>
            <span className="mx-auto grid size-14 place-items-center rounded-full bg-slate-100 text-2xl">
              ✦
            </span>
            <h3 className="mt-4 font-black">{label}</h3>
            <p className="muted mt-1 text-sm">
              New operational records will appear here automatically.
            </p>
          </div>
        </div>
      ) : (
        children
      )}
    </div>
  );
}
function Status({ value }: { value: string }) {
  const good = [
    "active",
    "approved",
    "confirmed",
    "paid",
    "completed",
  ].includes(value);
  const bad = [
    "blocked",
    "rejected",
    "cancelled",
    "failed",
    "refunded",
  ].includes(value);
  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-xs font-bold capitalize ${good ? "bg-emerald-50 text-emerald-700" : bad ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}
    >
      {value}
    </span>
  );
}
