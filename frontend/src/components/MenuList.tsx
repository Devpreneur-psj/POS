import { MenuItem } from "../types";

interface MenuListProps {
  items: MenuItem[];
  onAdd: (item: MenuItem) => void;
}

const categoryLabel: Record<string, string> = {
  COCKTAIL: "칵테일",
  LIQUOR: "양주",
  BEVERAGE: "음료"
};

export function MenuList({ items, onAdd }: MenuListProps) {
  const grouped = items.reduce<Record<string, MenuItem[]>>((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([category, list]) => (
        <section key={category}>
          <header className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">{categoryLabel[category] ?? category}</h3>
            <span className="text-xs uppercase tracking-wide text-slate-500">{list.length} items</span>
          </header>
          <div className="grid gap-3 sm:grid-cols-2">
            {list.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onAdd(item)}
                className="flex flex-col gap-1 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-left transition hover:border-brand-accent hover:bg-slate-900 hover:shadow-pos"
              >
                <div className="flex items-center justify-between">
                  <p className="text-base font-medium text-white">{item.name}</p>
                  <span className="text-sm font-semibold text-brand-accent">
                    ₩{item.base_price.toLocaleString()}
                  </span>
                </div>
                {item.description && (
                  <p className="text-xs leading-relaxed text-slate-400">{item.description}</p>
                )}
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

