import MockSyncButton from "@/components/admin/MockSyncButton";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function SettingsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <div className="rounded-xl border bg-white p-4 space-y-2">
        <div className="font-medium">Mock Pillar9 Sync</div>
        <div className="text-sm text-gray-600">
          This simulates listings being updated from Pillar9 (upserts by key).
        </div>
        <MockSyncButton />
      </div>
    </div>
  );
}
