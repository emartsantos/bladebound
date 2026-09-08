'use client';

import { useMemo, useState } from 'react';
import { ITEM_BY_ID } from '@premium-rpg/game-data';
import { RARITY_TREATMENTS } from '@premium-rpg/ui-tokens';
import type { MarketplaceAssetType } from '@/lib/persistence/game-persistence';
import { useGame } from '@/lib/game-state';
import { itemName } from '@/lib/item-names';
import { EmptyState, GameButton, ItemSlot, Panel, PanelLabel, SectionHeader } from '@/components/game/primitives';
import { LuArrowLeftRight, LuCoins, LuHistory, LuSearch, LuShieldCheck, LuStore, LuSwords, LuUserRound } from 'react-icons/lu';

type Tab = 'browse' | 'sell' | 'history';
type Filter = 'all' | MarketplaceAssetType;
const PAGE_SIZE = 6;

export function MarketplaceSection() {
  const { state, playerId, createMarketplaceListing, cancelMarketplaceListing, buyMarketplaceListing } = useGame();
  const [tab, setTab] = useState<Tab>('browse');
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [assetType, setAssetType] = useState<MarketplaceAssetType>('weapon');
  const [assetId, setAssetId] = useState('');
  const [price, setPrice] = useState('1');

  const availableWeapons = useMemo(() => Object.entries(state.inventory)
    .filter(([id, qty]) => qty > 0 && ITEM_BY_ID[id]?.equipmentSlot === 'weapon')
    .map(([id]) => id), [state.inventory]);
  const active = useMemo(() => state.marketplace.listings
    .filter((listing) => listing.status === 'active')
    .filter((listing) => filter === 'all' || listing.assetType === filter)
    .filter((listing) => `${listing.title} ${listing.sellerName}`.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => b.createdAt - a.createdAt), [state.marketplace.listings, filter, search]);
  const pages = Math.max(1, Math.ceil(active.length / PAGE_SIZE));
  const visible = active.slice((Math.min(page, pages) - 1) * PAGE_SIZE, Math.min(page, pages) * PAGE_SIZE);
  const ownListings = state.marketplace.listings.filter((listing) => listing.sellerId === playerId && listing.status === 'active');
  const selectedId = assetType === 'hero' ? playerId : assetId;
  const numericPrice = Number(price);
  const canList = selectedId && Number.isFinite(numericPrice) && numericPrice >= 0.01 && state.investment.bhc >= state.marketplace.listingFee && (assetType !== 'hero' || !state.marketplace.heroLocked);

  const chooseTab = (next: Tab) => { setTab(next); setPage(1); };
  const submitListing = () => {
    if (!canList) return;
    createMarketplaceListing(assetType, selectedId, numericPrice);
    setAssetId('');
  };

  return <div className="max-w-5xl space-y-4">
    <SectionHeader title="Marketplace" eyebrow="The Exchange" actions={<div className="rounded-sm border border-ember/40 bg-ember/10 px-3 py-1.5 font-mono text-xs text-emberLight">{state.investment.bhc.toFixed(3)} BHC</div>} />

    <Panel bodyClassName="p-3">
      <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-mist">
        <span className="flex items-center gap-2"><LuShieldCheck className="h-4 w-4 text-verdant" /> Listed assets are locked in escrow. Purchases transfer BHC; they do not burn it.</span>
        <span className="font-mono text-emberLight">Listing fee {state.marketplace.listingFee.toFixed(3)} BHC · burned</span>
      </div>
    </Panel>

    <div className="flex rounded-sm border border-iron bg-charcoal p-0.5">
      {(['browse', 'sell', 'history'] as Tab[]).map((entry) => <button key={entry} onClick={() => chooseTab(entry)} className={`flex-1 rounded-[3px] px-3 py-2 text-[11px] capitalize transition-colors ${tab === entry ? 'bg-ember/15 text-emberLight' : 'text-mist hover:text-bone'}`}>{entry}</button>)}
    </div>

    {tab === 'browse' && <>
      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="flex flex-1 items-center gap-2 rounded-sm border border-iron bg-charcoal px-3 py-2"><LuSearch className="h-4 w-4 text-stone" /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search assets or sellers" className="w-full bg-transparent text-xs text-bone outline-none placeholder:text-stone" /></label>
        <div className="flex rounded-sm border border-iron bg-charcoal p-0.5">{(['all', 'hero', 'weapon'] as Filter[]).map((entry) => <button key={entry} onClick={() => { setFilter(entry); setPage(1); }} className={`rounded-[3px] px-3 py-1.5 text-[10px] capitalize ${filter === entry ? 'bg-bronze/15 text-bronze' : 'text-stone'}`}>{entry}</button>)}</div>
      </div>
      {visible.length ? <div className="grid gap-3 md:grid-cols-2">{visible.map((listing) => {
        const item = listing.assetType === 'weapon' ? ITEM_BY_ID[listing.assetId] : undefined;
        const treatment = item ? RARITY_TREATMENTS[item.rarity] : undefined;
        const own = listing.sellerId === playerId;
        const affordable = state.investment.bhc + 0.000001 >= listing.price;
        return <div key={listing.id} className="panel flex items-center gap-3 p-3">
          <ItemSlot rarity={item?.rarity ?? 'rare'} size="lg">{listing.assetType === 'weapon' ? <LuSwords className="h-6 w-6" style={{ color: treatment?.bright }} /> : <LuUserRound className="h-6 w-6 text-emberLight" />}</ItemSlot>
          <div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold text-bone">{listing.title}</div><div className="text-[10px] capitalize text-stone">{listing.assetType} · Seller {listing.sellerName}</div><div className="mt-1 text-[10px] text-mist">{listing.assetType === 'hero' ? `Cooldown preserved · Lv ${String(listing.snapshot.combatLevel ?? '—')}` : `${String(listing.snapshot.rarity ?? 'common')} · Forge +${String(listing.snapshot.forgeLevel ?? 0)}`}</div></div>
          <div className="text-right"><div className="mb-1 font-mono text-sm text-bronze">{listing.price} BHC</div>{own ? <GameButton variant="ghost" onClick={() => cancelMarketplaceListing(listing.id)}>Cancel</GameButton> : <GameButton variant="primary" disabled={!affordable} onClick={() => buyMarketplaceListing(listing.id)}>Buy</GameButton>}</div>
        </div>;
      })}</div> : <EmptyState icon={<LuStore className="h-7 w-7" />} title="No listings found" hint="Try a different search or asset filter." />}
      <div className="flex items-center justify-between text-[10px] text-stone"><span>{active.length} active listings</span><div className="flex items-center gap-2"><GameButton variant="ghost" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</GameButton><span className="font-mono">{Math.min(page, pages)} / {pages}</span><GameButton variant="ghost" disabled={page >= pages} onClick={() => setPage((value) => Math.min(pages, value + 1))}>Next</GameButton></div></div>
    </>}

    {tab === 'sell' && <div className="grid gap-4 lg:grid-cols-2">
      <Panel header={<><LuArrowLeftRight className="h-4 w-4 text-bronze" /><PanelLabel>Create listing</PanelLabel></>}>
        <div className="space-y-3">
          <div className="flex rounded-sm border border-iron bg-charcoal p-0.5">{(['weapon', 'hero'] as MarketplaceAssetType[]).map((entry) => <button key={entry} onClick={() => { setAssetType(entry); setAssetId(''); }} className={`flex-1 rounded-[3px] px-3 py-1.5 text-[10px] capitalize ${assetType === entry ? 'bg-ember/15 text-emberLight' : 'text-stone'}`}>{entry}</button>)}</div>
          {assetType === 'weapon' ? <select value={assetId} onChange={(event) => setAssetId(event.target.value)} className="w-full rounded-sm border border-iron bg-charcoal px-3 py-2 text-xs text-bone"><option value="">Choose an unequipped weapon</option>{availableWeapons.map((id) => <option key={id} value={id}>{itemName(id)} · owned {state.inventory[id]}</option>)}</select> : <div className="rounded-sm border border-iron bg-charcoal p-3 text-xs text-mist"><div className="font-semibold text-bone">{state.playerName} · Level {state.combatLevel}</div><div className="mt-1">Listing locks all hero actions. Battle cooldown and progression travel with the Hero.</div></div>}
          <label className="block"><span className="mb-1 block text-[10px] uppercase tracking-wider text-stone">Price in BHC</span><input type="number" min="0.01" step="0.001" value={price} onChange={(event) => setPrice(event.target.value)} className="w-full rounded-sm border border-iron bg-charcoal px-3 py-2 font-mono text-xs text-bone outline-none focus:border-bronze" /></label>
          <div className="rounded-sm bg-black/15 p-2 text-[10px] text-mist">Validation runs before the {state.marketplace.listingFee.toFixed(3)} BHC burn. The fee is not refunded after a successful listing, even if cancelled.</div>
          <GameButton variant="primary" disabled={!canList} onClick={submitListing} className="w-full justify-center"><LuCoins className="h-3.5 w-3.5" /> List and burn {state.marketplace.listingFee.toFixed(3)} BHC</GameButton>
        </div>
      </Panel>
      <Panel header={<><LuStore className="h-4 w-4 text-bronze" /><PanelLabel>Your active listings</PanelLabel></>}>
        <div className="space-y-2">{ownListings.map((listing) => <div key={listing.id} className="flex items-center justify-between rounded-sm border border-iron bg-charcoal/60 p-3"><div><div className="text-xs font-semibold text-bone">{listing.title}</div><div className="text-[10px] text-stone">{listing.price} BHC · asset locked</div></div><GameButton variant="ghost" onClick={() => cancelMarketplaceListing(listing.id)}>Cancel</GameButton></div>)}{!ownListings.length && <p className="text-[11px] text-stone">You have no active listings.</p>}</div>
      </Panel>
    </div>}

    {tab === 'history' && <Panel header={<><LuHistory className="h-4 w-4 text-bronze" /><PanelLabel>Marketplace history</PanelLabel></>}>
      <div className="space-y-2">{state.marketplace.history.map((entry) => <div key={entry.id} className="flex items-center justify-between border-b border-iron/50 pb-2 text-[11px]"><div><span className="text-mist">{entry.label}</span><span className="ml-2 capitalize text-stone">{entry.type}</span></div><span className="font-mono text-bronze">{entry.amount ? `${entry.amount} BHC` : '—'}</span></div>)}{!state.marketplace.history.length && <EmptyState icon={<LuHistory className="h-7 w-7" />} title="No market activity" hint="Listings, purchases, and cancellations appear here." />}</div>
    </Panel>}
  </div>;
}
