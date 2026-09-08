'use client';

import { useMemo, useState } from 'react';
import { RARITY_TREATMENTS } from '@premium-rpg/ui-tokens';
import type { ShopItemDefinition } from '@premium-rpg/shared-types';
import { SHOP_STOCK, PRESTIGE_STOCK, ITEM_BY_ID } from '@premium-rpg/game-data';
import { LuCoins, LuGem, LuShoppingBag, LuSwords, LuSkull } from 'react-icons/lu';
import { useGame } from '@/lib/game-state';
import { shopBuyPrice, shopSellPrice } from '@/lib/game/service';
import { itemName } from '@/lib/item-names';
import { SectionHeader, Panel, PanelLabel, GameButton, ItemSlot, EmptyState } from '@/components/game/primitives';

type Tab = 'gear' | 'material' | 'seals';

const TAB_LABEL: Record<Tab, string> = {
  gear: 'Gear',
  material: 'Materials',
  seals: 'Prestige',
};

function ShopRow({ def, owned, level, soldOut }: { def: ShopItemDefinition; owned: number; level: number; soldOut: boolean }) {
  const { buyShopItem, sellItem } = useGame();
  const item = ITEM_BY_ID[def.itemId];
  const treat = item ? RARITY_TREATMENTS[item.rarity] : undefined;
  const locked = level < (def.levelRequired ?? 0);
  const buyPrice = shopBuyPrice(def);
  const sellPrice = shopSellPrice(def.itemId);
  const used = owned > 0;

  return (
    <div className="panel flex items-center gap-3 p-3">
      <ItemSlot rarity={item?.rarity ?? 'common'} size="md" qty={owned}>
        {item ? <LuSwords className="h-5 w-5" style={{ color: treat?.bright ?? '#55514b' }} /> : <LuShoppingBag className="h-5 w-5 text-stone/50" />}
      </ItemSlot>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-sm font-semibold text-bone">{itemName(def.itemId)}</span>
          {(def.stock != null || def.onetime) && (
            <span className="rounded-sm border border-iron/60 px-1 py-0.5 text-[9px] uppercase tracking-wider text-stone">
              {def.onetime ? 'One-time' : `×${(def.stock ?? 0) - owned}`}
            </span>
          )}
          {locked && (
            <span className="rounded-sm border border-ember/40 bg-ember/10 px-1 py-0.5 text-[9px] uppercase tracking-wider text-emberLight">
              Lv {def.levelRequired}
            </span>
          )}
        </div>
        <div className="text-[11px] capitalize text-mist">{item?.type ?? def.category}</div>
        {sellPrice > 0 && owned > 0 && (
          <button onClick={() => sellItem(def.itemId)} className="mt-0.5 text-[10px] text-stone underline-offset-2 hover:text-bronze hover:underline">
            Sell 1 · +{sellPrice} gold
          </button>
        )}
      </div>
      <div className="flex flex-col items-end gap-1">
        <GameButton
          variant={locked ? 'active' : 'primary'}
          disabled={locked || soldOut}
          onClick={() => buyShopItem(def.id)}
          className="px-2.5 py-1 text-[11px]"
        >
          {def.currency === 'gold' ? <LuCoins className="h-3 w-3" /> : <LuGem className="h-3 w-3" />}
          {buyPrice}
        </GameButton>
        {soldOut && !locked && !used && <span className="text-[10px] text-stone">Sold out</span>}
        {used && <span className="text-[10px] text-verdant">Purchased</span>}
      </div>
    </div>
  );
}

export function ShopSection() {
  const { state } = useGame();
  const [tab, setTab] = useState<Tab>('gear');
  const gold = state.gold;
  const level = state.combatLevel;

  const items: ShopItemDefinition[] = useMemo(() => {
    if (tab === 'seals') return PRESTIGE_STOCK;
    return SHOP_STOCK.filter((s) => s.category === tab);
  }, [tab]);

  return (
    <div className="max-w-3xl space-y-4">
      <SectionHeader
        title="Shop"
        eyebrow="Market"
        actions={
          <div className="flex items-center gap-1.5 rounded-sm border border-iron/70 bg-charcoal px-2.5 py-1.5">
            <LuCoins className="h-3.5 w-3.5 text-bronze" />
            <span className="text-xs font-semibold text-bronze tabular-nums">{gold.toLocaleString()}</span>
          </div>
        }
      />

      <div className="flex items-center rounded-sm border border-iron bg-charcoal p-0.5">
        {(Object.keys(TAB_LABEL) as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-[3px] px-2.5 py-1.5 text-[11px] transition-colors ${
              tab === t ? 'bg-ember/15 text-emberLight' : 'text-mist hover:text-bone'
            }`}
          >
            {TAB_LABEL[t]}
          </button>
        ))}
      </div>

      {tab === 'seals' && (
        <Panel bodyClassName="p-3">
          <div className="flex items-center gap-2 text-xs text-mist">
            <LuGem className="h-3.5 w-3.5 text-bronze" />
            <span>Prestige wares are paid with dungeon seals earned in deep runs. Seals are not yet spendable in this demo.</span>
          </div>
        </Panel>
      )}

      {items.length === 0 ? (
        <EmptyState icon={<LuSkull className="h-7 w-7" />} title="Stalls shuttered" hint="No wares listed for this stall yet." />
      ) : (
        <div className="space-y-3">
          {items.map((def) => {
            const owned = state.shopBought[def.id] ?? 0;
            const soldOut = (def.stock != null && owned >= def.stock) || (def.onetime === true && owned >= 1);
            return <ShopRow key={def.id} def={def} owned={owned} level={level} soldOut={soldOut} />;
          })}
        </div>
      )}
    </div>
  );
}