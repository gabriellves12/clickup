"use client";

import * as React from "react";
import { Avatar, IconButton } from "@/components/ui/primitives";
import { CategoryIcon, IcExternal, IcPlus, IcChevronDown, IcFolder } from "@/components/icons";
import { cn } from "@/lib/cn";
import type { ClientWithLinks, LinkItemLite } from "./types";

function group(items: LinkItemLite[]) {
  const roots = items.filter((i) => !i.parentId).sort((a, b) => a.order - b.order);
  const kids: Record<string, LinkItemLite[]> = {};
  items.filter((i) => i.parentId).forEach((i) => {
    (kids[i.parentId!] ||= []).push(i);
  });
  Object.values(kids).forEach((arr) => arr.sort((a, b) => a.order - b.order));
  return { roots, kids };
}

export function ClientLinksCard({
  client,
  onAddLink,
  onEditLink,
}: {
  client: ClientWithLinks;
  onAddLink: (clientId: string, parentId?: string | null) => void;
  onEditLink: (item: LinkItemLite) => void;
}) {
  const [open, setOpen] = React.useState(true);
  const { roots, kids } = group(client.links);

  return (
    <div className="bg-surface border border-border rounded-[12px] p-3.5 grid gap-3">
      <div className="flex items-center gap-3">
        <Avatar size="lg" initials={client.initials} className="border-2" />
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-semibold tracking-tight text-text truncate">{client.name}</div>
          <div className="text-[11px] text-text-3">{client.links.length} acessos</div>
        </div>
        <IconButton onClick={() => setOpen((v) => !v)} aria-label="Alternar">
          <IcChevronDown className={cn("size-3.5 transition-transform", !open && "-rotate-90")} />
        </IconButton>
      </div>
      {open && (
        <>
          <div className="grid gap-0.5">
            {roots.map((root) => (
              <React.Fragment key={root.id}>
                <LinkRow item={root} onEdit={onEditLink} onAddNested={onAddLink} clientId={client.id} />
                {kids[root.id]?.length ? (
                  <div className="pl-6 grid gap-0.5">
                    {kids[root.id].map((child) => (
                      <React.Fragment key={child.id}>
                        <LinkRow item={child} onEdit={onEditLink} onAddNested={onAddLink} clientId={client.id} isNested />
                        {kids[child.id]?.length ? (
                          <div className="pl-6 grid gap-0.5">
                            {kids[child.id].map((leaf) => (
                              <LinkRow key={leaf.id} item={leaf} onEdit={onEditLink} onAddNested={onAddLink} clientId={client.id} isNested />
                            ))}
                          </div>
                        ) : null}
                      </React.Fragment>
                    ))}
                  </div>
                ) : null}
              </React.Fragment>
            ))}
          </div>
          <button
            type="button"
            onClick={() => onAddLink(client.id, null)}
            className="inline-flex items-center gap-1.5 self-start text-[12px] text-text-3 hover:text-text px-2 py-1 rounded-md hover:bg-surface-2 border border-transparent hover:border-border transition-colors"
          >
            <IcPlus className="size-3" /> adicionar acesso
          </button>
        </>
      )}
    </div>
  );
}

function LinkRow({
  item, clientId, onEdit, onAddNested, isNested,
}: {
  item: LinkItemLite;
  clientId: string;
  onEdit: (i: LinkItemLite) => void;
  onAddNested: (clientId: string, parentId: string) => void;
  isNested?: boolean;
}) {
  const Icon = item.category === "product" ? IcFolder : null;
  const Cat = Icon ? Icon : ({ className }: { className?: string }) => <CategoryIcon category={item.category} className={className} />;

  return (
    <div className="group grid grid-cols-[22px_1fr_auto] items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-surface-2">
      <span className="text-text-3">
        <Cat className="size-3.5" />
      </span>
      <div className="min-w-0 flex items-center gap-2">
        {item.url ? (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[13px] text-text hover:underline underline-offset-2 no-underline truncate"
          >
            {item.label}
          </a>
        ) : (
          <span className="text-[13px] text-text truncate">{item.label}</span>
        )}
        {item.observation && (
          <span className="text-[11px] text-text-3 mono truncate">{item.observation}</span>
        )}
      </div>
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {item.url && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="grid place-items-center size-6 rounded-md text-text-3 hover:text-text hover:bg-surface-3"
            aria-label="Abrir link"
          >
            <IcExternal className="size-3" />
          </a>
        )}
        {item.category === "product" && (
          <button
            type="button"
            onClick={() => onAddNested(clientId, item.id)}
            aria-label="Adicionar pasta"
            className="grid place-items-center size-6 rounded-md text-text-3 hover:text-text hover:bg-surface-3"
          >
            <IcPlus className="size-3" />
          </button>
        )}
        <button
          type="button"
          onClick={() => onEdit(item)}
          className="grid place-items-center h-6 px-1.5 rounded-md text-[10px] text-text-3 hover:text-text hover:bg-surface-3"
        >
          editar
        </button>
      </div>
    </div>
  );
}
