import { useState } from "react";
import { PRODUCT_SIZES, PRODUCT_TYPES, type Product, type ProductType } from "../../services/logs";
import { fieldCls } from "./fields";

export function ProductsEditor({ value, onChange }: { value: Product[]; onChange: (v: Product[]) => void }) {
  const [type, setType] = useState<ProductType>("Pad");
  const [size, setSize] = useState("");
  const [label, setLabel] = useState("");
  const [quantity, setQuantity] = useState(1);
  const sizes = PRODUCT_SIZES[type];

  const canAdd = quantity >= 1 && (sizes.length === 0 || size !== "") && (type !== "Other" || label.trim() !== "");
  const add = () => {
    if (!canAdd) return;
    onChange([...value, { type, label: label.trim(), size: sizes.length ? size : null, quantity }]);
    setSize("");
    setLabel("");
    setQuantity(1);
  };

  return (
    <div>
      <p className="text-body-sm font-semibold text-ink">Products used</p>
      {value.length > 0 && (
        <ul className="mt-2 grid gap-2">
          {value.map((p, i) => (
            <li key={`${p.type}-${i}`} className="flex items-center justify-between gap-3 rounded-[14px] bg-blush-50 px-3.5 py-2 text-body-sm text-ink">
              <span>
                {p.quantity} × {p.label || p.type}
                {p.size ? ` (${p.size})` : ""}
              </span>
              <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="font-semibold text-rose-ink underline">
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_5rem_auto] sm:items-end">
        <label className="text-caption font-semibold text-ink-muted">
          Type
          <select value={type} onChange={(e) => { setType(e.target.value as ProductType); setSize(""); }} className={fieldCls}>
            {PRODUCT_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </label>
        {sizes.length > 0 ? (
          <label className="text-caption font-semibold text-ink-muted">
            Size
            <select value={size} onChange={(e) => setSize(e.target.value)} className={fieldCls}>
              <option value="">Choose…</option>
              {sizes.map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>
        ) : (
          <label className="text-caption font-semibold text-ink-muted">
            Describe it
            <input value={label} maxLength={60} onChange={(e) => setLabel(e.target.value)} className={fieldCls} />
          </label>
        )}
        <label className="text-caption font-semibold text-ink-muted">
          Qty
          <input type="number" min={1} max={20} value={quantity} onChange={(e) => setQuantity(Math.min(20, Math.max(1, Number(e.target.value) || 1)))} className={fieldCls} />
        </label>
        <button type="button" onClick={add} disabled={!canAdd} className="rounded-full bg-rose px-5 py-2.5 text-body font-semibold text-white disabled:opacity-50">
          Add
        </button>
      </div>
    </div>
  );
}
