"use client";

import Link from "next/link";
import { format, parseISO } from "date-fns";
import {
  ArrowLeftRight,
  Boxes,
  ChartCandlestick,
  CalendarDays,
  Clock,
  Coins,
  Flame,
  Newspaper,
  OctagonAlert,
  ShieldCheck,
  TriangleAlert,
  LayoutGrid,
  Shapes,
} from "lucide-react";
import { Line, LineChart, ResponsiveContainer, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { WidgetCard } from "@/components/shared/widget-card";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/shared/states";
import { SourceBadge } from "@/components/shared/source-badge";
import { useShellUser } from "@/components/layout/user-context";
import { allNav } from "@/config/navigation";
import { useNow } from "@/hooks/use-now";
import { formatCompact, formatCurrency, formatDate, formatRate, formatRelative } from "@/utils/format";
import { usePairHistory, usePairQuotes, useWatchlist } from "@/features/currency/hooks";
import { OVERVIEW_PAIRS } from "@/features/currency/constants";
import { ChangeIndicator } from "@/features/currency/components/change-indicator";
import { computeTotals, isHeld, useAssets } from "@/features/assets/hooks";
import { CategoryDistributionChart } from "@/features/assets/components/asset-charts";
import { useCveOverview } from "@/features/cve/hooks";
import { CveRow } from "@/features/cve/components/cve-row";
import { useGoldBoard, useGoldHistory } from "@/features/gold/hooks";
import { DEFAULT_GOLD_TYPE, DEFAULT_GOLD_WEIGHT, OVERVIEW_GOLD_TYPES } from "@/features/gold/constants";
import { formatIdr, formatWeight } from "@/features/gold/format";
import { useIndexSnapshot, useStockHistory, useStockQuotes } from "@/features/stocks/hooks";
import { COMPOSITE, OVERVIEW_STOCKS } from "@/features/stocks/constants";
import { formatIndex, formatPrice } from "@/features/stocks/format";
import { useNews } from "@/features/news/hooks";
import { NewsThumb } from "@/features/news/components/news-thumb";
import { titleCase } from "@/features/prayer/format";
import { usePrayerCity, usePrayerToday } from "@/features/prayer/hooks";
import { TodayPrayersCard } from "@/features/prayer/components/today-prayers";
import { zonedNow } from "@/features/prayer/time";
import { HOLIDAY_TIME_ZONE, untilLabel, useNextDayOff } from "@/features/holidays/next-day-off";
import { HolidayTypeBadge } from "@/features/holidays/components/type-badge";

function greeting(hour: number) {
  if (hour < 4) return "Good night";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  if (hour < 22) return "Good evening";
  return "Good night";
}

export function WelcomeWidget() {
  const user = useShellUser();
  const now = useNow(1000);
  const name = user.fullName?.split(" ")[0] || user.email.split("@")[0];
  const hour = now ? Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: user.timezone }).format(now)) : null;

  return (
    <section className="flex flex-col justify-between gap-4 rounded-xl border bg-card p-5 sm:flex-row sm:items-center">
      <div>
        <p className="text-xs text-muted-foreground">{hour === null ? <span className="inline-block h-3 w-24" /> : greeting(hour)}</p>
        <h2 className="mt-0.5 text-xl font-semibold tracking-tight">{name}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {user.professionalTitle ?? "Personal Command Center"} · {user.email}
        </p>
      </div>
      <div className="flex items-center gap-3 sm:text-right">
        <CalendarDays className="size-5 text-muted-foreground sm:order-2" />
        {now ? (
          <div>
            <p className="tabular font-mono text-2xl font-semibold tracking-tight">
              {new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, timeZone: user.timezone }).format(now)}
            </p>
            <p className="text-xs text-muted-foreground">
              {new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: user.timezone }).format(now)} ·{" "}
              {user.timezone}
            </p>
          </div>
        ) : (
          <Skeleton className="h-12 w-48" />
        )}
      </div>
    </section>
  );
}

/** Headline figure with a one-month sparkline, shared by the currency, gold and stock widgets. */
function HeadlineFigure({
  label,
  value,
  change,
  changeLabel,
  points,
  dataKey,
  chartLabel,
}: {
  label: string;
  value: string;
  change: number | null | undefined;
  changeLabel: string;
  points: object[];
  dataKey: string;
  chartLabel: string;
}) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className="tabular mt-0.5 truncate text-xl font-semibold tracking-tight">{value}</p>
        <p className="flex flex-wrap items-center gap-x-1.5 text-[11px] text-muted-foreground">
          <ChangeIndicator value={change ?? null} />
          <span>{changeLabel}</span>
        </p>
      </div>
      {points.length > 1 && (
        <div className="h-12 w-28 shrink-0" role="img" aria-label={chartLabel}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
              <YAxis hide domain={["dataMin", "dataMax"]} />
              <Line type="monotone" dataKey={dataKey} stroke="var(--series-1)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export function CurrencyWidget() {
  const watchlist = useWatchlist();
  const pairs = watchlist.data?.length
    ? watchlist.data.slice(0, 5).map((w) => ({ base: w.base_currency, quote: w.quote_currency }))
    : OVERVIEW_PAIRS;
  const quotes = usePairQuotes(watchlist.isLoading ? [] : pairs);
  const rows = quotes.data?.data ?? [];
  const [featured, ...others] = rows;
  const history = usePairHistory(featured?.base ?? "", featured?.quote ?? "", "1M", Boolean(featured));
  const featuredName = featured ? `${featured.base}/${featured.quote}` : "";

  return (
    <WidgetCard title="Currency overview" icon={ArrowLeftRight} href="/currency" footer={<SourceBadge meta={quotes.data?.meta} />}>
      {quotes.isError ? (
        <ErrorState title="Exchange rates unavailable" error={quotes.error} onRetry={() => void quotes.refetch()} compact />
      ) : !quotes.data ? (
        <ListSkeleton rows={3} />
      ) : !featured ? (
        <EmptyState title="No rates for these pairs" description="The ECB does not publish these pairs. Change them in the watchlist on Currency Exchange." compact />
      ) : (
        <div className="space-y-4">
          <HeadlineFigure
            label={`${featuredName}, ECB reference rate`}
            value={formatRate(featured.rate)}
            change={featured.changePercent}
            changeLabel="vs previous fixing"
            points={history.data?.data.points ?? []}
            dataKey="rate"
            chartLabel={`${featuredName} reference rate, last month`}
          />
          <ul className="space-y-2 border-t pt-3">
            {others.map((q) => (
              <li key={`${q.base}-${q.quote}`} className="flex items-center justify-between gap-3">
                <span className="font-mono text-xs font-medium">{q.base}/{q.quote}</span>
                <span className="flex items-center gap-2">
                  <span className="tabular text-sm font-medium">{formatRate(q.rate)}</span>
                  <ChangeIndicator value={q.changePercent} className="w-16 justify-end" />
                </span>
              </li>
            ))}
            <li className="text-[11px] text-muted-foreground">ECB fixing, {formatDate(featured.date, "dd MMM yyyy")}</li>
          </ul>
        </div>
      )}
    </WidgetCard>
  );
}

export function GoldWidget() {
  const board = useGoldBoard();
  const history = useGoldHistory(DEFAULT_GOLD_TYPE, DEFAULT_GOLD_WEIGHT, "1M");
  const h = history.data?.data;
  const others = OVERVIEW_GOLD_TYPES.map((type) => ({
    type,
    item: board.data?.data.products.find((p) => p.type === type)?.items.find((i) => i.weight === DEFAULT_GOLD_WEIGHT),
  }));
  const featured = `${DEFAULT_GOLD_TYPE} ${formatWeight(DEFAULT_GOLD_WEIGHT)}`;

  return (
    <WidgetCard title="Gold prices" icon={Coins} href="/gold" footer={<SourceBadge meta={history.data?.meta ?? board.data?.meta} showSource={false} />}>
      {history.isError && board.isError ? (
        <ErrorState title="Gold prices unavailable" error={history.error} onRetry={() => { void history.refetch(); void board.refetch(); }} compact />
      ) : !h && !board.data ? (
        <ListSkeleton rows={3} />
      ) : (
        <div className="space-y-4">
          {h ? (
            <HeadlineFigure
              label={`${featured}, selling`}
              value={h.latest === null ? "Out of stock" : formatIdr(h.latest)}
              change={h.dayChangePercent}
              changeLabel="vs previous day"
              points={h.points}
              dataKey="sell"
              chartLabel={`${featured} selling price, last month`}
            />
          ) : history.isError ? (
            <ErrorState title={`${featured} history unavailable`} error={history.error} onRetry={() => void history.refetch()} compact />
          ) : (
            <ListSkeleton rows={1} />
          )}
          {board.data && (
            <ul className="space-y-2 border-t pt-3">
              {others.map(({ type, item }) => (
                <li key={type} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-xs font-medium">{type} {formatWeight(DEFAULT_GOLD_WEIGHT)}</span>
                  <span className={item?.sell ? "tabular font-medium" : "text-xs text-muted-foreground"}>
                    {item?.sell ? formatIdr(item.sell) : item ? "Out of stock today" : "Not listed"}
                  </span>
                </li>
              ))}
              {h && h.latestDate && (
                <li className="text-[11px] text-muted-foreground">Galeri 24 price list, {formatDate(h.latestDate, "dd MMM yyyy")}</li>
              )}
            </ul>
          )}
        </div>
      )}
    </WidgetCard>
  );
}

export function StocksWidget() {
  const index = useIndexSnapshot();
  const history = useStockHistory(COMPOSITE, "1M");
  const quotes = useStockQuotes(OVERVIEW_STOCKS);
  const d = index.data?.data;
  const points = history.data?.data.points ?? [];

  return (
    <WidgetCard title="Indonesian stocks" icon={ChartCandlestick} href="/stocks" footer={<SourceBadge meta={index.data?.meta ?? quotes.data?.meta} showSource={false} />}>
      {index.isError && quotes.isError ? (
        <ErrorState title="Stock data unavailable" error={index.error} onRetry={() => { void index.refetch(); void quotes.refetch(); }} compact />
      ) : !d && !quotes.data ? (
        <ListSkeleton rows={3} />
      ) : (
        <div className="space-y-4">
          {d ? (
            <HeadlineFigure
              label="IHSG"
              value={formatIndex(d.last)}
              change={d.changePercent}
              changeLabel="vs previous close"
              points={points}
              dataKey="close"
              chartLabel="IHSG daily close, last month"
            />
          ) : index.isError ? (
            <ErrorState title="IHSG unavailable" error={index.error} onRetry={() => void index.refetch()} compact />
          ) : (
            <ListSkeleton rows={1} />
          )}
          {quotes.isError ? (
            <p className="border-t pt-3 text-xs text-muted-foreground">Watchlist quotes unavailable: {quotes.error.message}</p>
          ) : quotes.data ? (
            <ul className="space-y-2 border-t pt-3">
              {quotes.data.data.map((q) => (
                <li key={q.code} className="flex items-center justify-between gap-3">
                  <span className="font-mono text-xs font-medium">{q.code}</span>
                  <span className="flex items-center gap-2">
                    <span className="tabular text-sm font-medium">{formatPrice(q.last)}</span>
                    <ChangeIndicator value={q.changePercent} className="w-16 justify-end" />
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <ListSkeleton rows={2} />
          )}
        </div>
      )}
    </WidgetCard>
  );
}

export function AssetsWidget() {
  const { assets, isLoading, isError, error, refetch } = useAssets();
  const totals = computeTotals(assets);
  const categories = new Set(assets.filter(isHeld).map((a) => a.category)).size;
  const compact = (n: number) => formatCurrency(n, "IDR", { notation: "compact" });

  return (
    <WidgetCard title="Asset overview" icon={Boxes} href="/assets">
      {isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} compact />
      ) : isLoading ? (
        <ListSkeleton rows={3} />
      ) : assets.length === 0 ? (
        <EmptyState icon={Boxes} title="No assets recorded" description="Add assets to keep their purchase details in one place." compact />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Mini icon={Coins} label="Acquisition cost" value={compact(totals.acquisitionCost)} />
            <Mini icon={Boxes} label="Total assets" value={String(totals.totalAssets)} />
            <Mini icon={Shapes} label="Categories" value={String(categories)} />
            <Mini icon={Boxes} label="Active assets" value={`${totals.activeAssets} / ${totals.totalAssets}`} />
          </div>
          <CategoryDistributionChart assets={assets} />
        </div>
      )}
    </WidgetCard>
  );
}

function Mini({ icon: Icon, label, value }: { icon: typeof Coins; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface-2 px-3 py-2">
      <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><Icon className="size-3" />{label}</p>
      <p className="tabular mt-0.5 truncate text-sm font-semibold">{value}</p>
    </div>
  );
}

export function CveWidget() {
  const overview = useCveOverview();
  const d = overview.data?.data;

  return (
    <WidgetCard title="CVE overview" icon={ShieldCheck} href="/cve" footer={<SourceBadge meta={overview.data?.meta} />} bodyClassName="p-0">
      {overview.isError ? (
        <div className="p-4"><ErrorState title="NVD unavailable" error={overview.error} onRetry={() => void overview.refetch()} compact /></div>
      ) : !d ? (
        <div className="p-4"><ListSkeleton rows={4} /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-4">
            <Mini icon={ShieldCheck} label={`New (${d.windowDays}d)`} value={formatCompact(d.total)} />
            <Mini icon={OctagonAlert} label="Critical" value={String(d.critical)} />
            <Mini icon={TriangleAlert} label="High" value={String(d.high)} />
            <Mini icon={Flame} label="KEV added (30d)" value={String(d.kevAddedLast30Days)} />
          </div>
          {d.latest.length === 0 ? (
            <div className="px-4 pb-4"><EmptyState title="No CVEs published in this window" compact /></div>
          ) : (
            <ul className="divide-y border-t">
              {d.latest.slice(0, 5).map((c) => <CveRow key={c.id} cve={c} compact />)}
            </ul>
          )}
        </>
      )}
    </WidgetCard>
  );
}

export function NewsWidget() {
  const news = useNews();
  const items = news.data?.data.articles.slice(0, 6) ?? [];

  return (
    <WidgetCard title="Technology news" icon={Newspaper} href="/news" footer={<SourceBadge meta={news.data?.meta} showSource={false} />}>
      {news.isError ? (
        <ErrorState title="News feeds unavailable" error={news.error} onRetry={() => void news.refetch()} compact />
      ) : news.isLoading ? (
        <ListSkeleton rows={5} />
      ) : items.length === 0 ? (
        <EmptyState title="No headlines loaded" description="The feeds returned no articles. They refresh every 20 minutes; Technology News shows each source's status." compact />
      ) : (
        <ul className="grid gap-3 xl:grid-cols-3 xl:gap-x-6">
          {items.map((a) => (
            <li key={a.id}>
              <a href={a.url} target="_blank" rel="noreferrer noopener" className="group flex gap-3">
                <NewsThumb src={a.imageUrl} source={a.source} className="size-12 shrink-0 rounded-md" />
                <div className="min-w-0">
                  <p className="line-clamp-2 text-sm leading-snug font-medium group-hover:text-primary">{a.title}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{a.source} · {formatRelative(a.publishedAt)}</p>
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  );
}

export function QuickAccessWidget({ links, onCustomize }: { links: string[]; onCustomize: () => void }) {
  const items = links.map((href) => allNav.find((n) => n.href === href)).filter((n): n is (typeof allNav)[number] => Boolean(n));
  return (
    <WidgetCard
      title="Quick access"
      icon={LayoutGrid}
      actions={<Button variant="ghost" size="sm" className="text-muted-foreground" onClick={onCustomize}>Customize</Button>}
    >
      {items.length === 0 ? (
        <EmptyState title="No shortcuts" description="Choose shortcuts in Customize." compact />
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {items.map((n) => (
            <Link key={n.href} href={n.href} className="group flex flex-col gap-2 rounded-lg border bg-surface-2/50 p-3 transition-colors hover:border-primary/40 hover:bg-primary/5">
              <n.icon className="size-4 text-muted-foreground group-hover:text-primary" />
              <span className="text-xs font-medium">{n.title}</span>
            </Link>
          ))}
        </div>
      )}
    </WidgetCard>
  );
}

/** Same card as on Prayer Times, for the city picked there. */
export function PrayerWidget() {
  const [city] = usePrayerCity();
  const query = usePrayerToday(city);
  return (
    <TodayPrayersCard
      query={query}
      title={(d) => (d ? `Prayer times today, ${titleCase(d.location.city)}` : "Prayer times today")}
      icon={Clock}
      href="/prayer"
    />
  );
}

/** Next day off plus the two dates after it; the full year lives on Public Holidays. */
export function HolidaysWidget() {
  const now = useNow(60 * 60 * 1000);
  const today = now ? zonedNow(now, HOLIDAY_TIME_ZONE).date : null;
  const { query, year, loaded, next, sameDay, later, stretch, daysUntil } = useNextDayOff(today);
  const afterNext = [...new Map(later.map((h) => [h.date, h])).values()].slice(0, 2);

  return (
    <WidgetCard title="Next day off" icon={CalendarDays} href="/holidays" footer={<SourceBadge meta={query.data?.meta} />}>
      {query.isError ? (
        <ErrorState title="Holidays unavailable" error={query.error} onRetry={() => void query.refetch()} compact />
      ) : !loaded || !today ? (
        <ListSkeleton rows={3} />
      ) : !next ? (
        <EmptyState
          icon={CalendarDays}
          compact
          title="No upcoming dates published"
          description={`Tanggal Merah has not published ${year! + 1} yet.`}
        />
      ) : (
        <div className="space-y-3">
          <div className="space-y-1">
            <p className="flex flex-wrap items-baseline gap-x-2">
              <span className="text-lg font-semibold tracking-tight">{format(parseISO(next.date), "EEE, d MMM")}</span>
              <span className="text-sm font-medium text-primary">{untilLabel(daysUntil!)}</span>
            </p>
            {sameDay.map((h) => (
              <p key={h.name} className="flex flex-wrap items-center gap-2 text-sm">
                <span className="min-w-0">{h.name}</span>
                <HolidayTypeBadge type={h.type} />
              </p>
            ))}
            {stretch && stretch.days > 1 && (
              <p className="text-xs text-muted-foreground">
                {stretch.days} days off in a row, {format(stretch.start, "EEE d")} to {format(stretch.end, "EEE d MMM")}
              </p>
            )}
          </div>
          {afterNext.length > 0 && (
            <ul className="space-y-1.5 border-t pt-3 text-xs">
              {afterNext.map((h) => (
                <li key={h.date} className="flex gap-3">
                  <span className="w-20 shrink-0 tabular-nums text-muted-foreground">{format(parseISO(h.date), "EEE d MMM")}</span>
                  <span className="min-w-0 truncate" title={h.name}>{h.name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </WidgetCard>
  );
}
