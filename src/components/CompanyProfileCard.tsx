import type { Locale } from "@/lib/types";
import { t } from "@/lib/i18n";

interface Profile {
  ticker: string;
  name: string | null;
  sector: string | null;
  subSector: string | null;
  listingBoard: string | null;
  address: string | null;
  website: string | null;
  syncedAt: Date;
}

export function CompanyProfileCard({
  profile,
  locale,
}: {
  profile: Profile;
  locale: Locale;
}) {
  const L = t(locale);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#D97706]">
        {L.profile}
      </p>
      <h2 className="mt-1 text-xl font-bold text-[#0F172A]">{profile.name ?? profile.ticker}</h2>
      <p className="text-sm font-mono text-[#475569]">{profile.ticker}</p>
      <dl className="mt-4 space-y-2 text-sm">
        {profile.sector && (
          <div>
            <dt className="text-[#D97706] font-semibold">Sector</dt>
            <dd className="text-[#475569]">{profile.sector}</dd>
          </div>
        )}
        {profile.subSector && (
          <div>
            <dt className="text-[#D97706] font-semibold">Sub-sector</dt>
            <dd className="text-[#475569]">{profile.subSector}</dd>
          </div>
        )}
        {profile.listingBoard && (
          <div>
            <dt className="text-[#D97706] font-semibold">Board</dt>
            <dd className="text-[#475569]">{profile.listingBoard}</dd>
          </div>
        )}
        {profile.address && (
          <div>
            <dt className="text-[#D97706] font-semibold">Address</dt>
            <dd className="text-[#475569]">{profile.address}</dd>
          </div>
        )}
        {profile.website && (
          <div>
            <dt className="text-[#D97706] font-semibold">Website</dt>
            <dd>
              <a
                href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-700 hover:underline"
              >
                {profile.website.replace(/^https?:\/\//, "")}
              </a>
            </dd>
          </div>
        )}
      </dl>
      <p className="mt-4 text-xs text-[#475569]">
        {L.lastUpdated}: {new Date(profile.syncedAt).toLocaleDateString(locale === "id" ? "id-ID" : "en-US")}
      </p>
    </div>
  );
}
