import { readFile } from "node:fs/promises";
import path from "node:path";
import { Prisma, PrismaClient } from "@prisma/client";

type SourceLink = { label: string; url: string | null; username: string | null; secret: string | null };
type SourceClient = {
  name: string;
  drive: SourceLink[];
  figma: SourceLink[];
  photos: SourceLink[];
  accesses: SourceLink[];
  products: SourceLink[];
  whatsappUrl: string | null;
};

const prisma = new PrismaClient();
const figmaQuery = "?m=auto&t=XGeUMhTRArZpou6t-6";

function readBalanced(source: string, start: number, open: string, close: string) {
  let depth = 0;
  let quote: string | null = null;
  let escaped = false;

  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'") { quote = char; continue; }
    if (char === open) depth += 1;
    if (char === close) {
      depth -= 1;
      if (depth === 0) return source.slice(start, index + 1);
    }
  }
  throw new Error(`Bloco ${open}${close} não foi fechado.`);
}

function topLevelObjects(arrayBlock: string) {
  const objects: string[] = [];
  let quote: string | null = null;
  let escaped = false;
  let start = -1;
  let depth = 0;

  for (let index = 0; index < arrayBlock.length; index += 1) {
    const char = arrayBlock[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'") { quote = char; continue; }
    if (char === "{") { if (depth === 0) start = index; depth += 1; }
    if (char === "}") {
      depth -= 1;
      if (depth === 0 && start >= 0) objects.push(arrayBlock.slice(start, index + 1));
    }
  }
  return objects;
}

function unquote(value: string) {
  return JSON.parse(`"${value}"`) as string;
}

function stringField(block: string, field: string) {
  const match = block.match(new RegExp(`\\b${field}\\s*:\\s*"((?:\\\\.|[^"\\\\])*)"`));
  return match ? unquote(match[1]) : null;
}

function arrayField(block: string, field: string) {
  const property = new RegExp(`\\b${field}\\s*:`).exec(block);
  if (!property) return [];
  const start = block.indexOf("[", property.index);
  if (start === -1) return [];
  return topLevelObjects(readBalanced(block, start, "[", "]"));
}

function linkFromBlock(block: string): SourceLink | null {
  const label = stringField(block, "r");
  if (!label) return null;
  const username = stringField(block, "usuario");
  const secret = stringField(block, "senha");
  const direct = stringField(block, "u");
  if (direct) return { label, url: direct, username, secret };

  const helper = block.match(/\bu\s*:\s*(dr|fg)\("((?:\\.|[^"\\])*)"\)/);
  if (!helper) return { label, url: null, username, secret };
  const value = unquote(helper[2]);
  const url = helper[1] === "dr"
    ? `https://drive.google.com/drive/folders/${value}`
    : `https://www.figma.com/design/${value}${figmaQuery}`;
  return { label, url, username, secret };
}

function linksFrom(block: string, field: string) {
  return arrayField(block, field)
    .map(linkFromBlock)
    .filter((link): link is SourceLink => Boolean(link));
}

function parseCentral(html: string): SourceClient[] {
  const marker = html.indexOf("const CLIENTES = [");
  if (marker === -1) throw new Error("Não encontrei a lista CLIENTES no HTML fornecido.");
  const start = html.indexOf("[", marker);
  const clientsBlock = readBalanced(html, start, "[", "]");

  return topLevelObjects(clientsBlock).map((block) => {
    const name = stringField(block, "nome");
    if (!name) throw new Error("Um cliente da lista não possui nome.");
    const group = linksFrom(block, "grupo")[0];
    return {
      name,
      drive: linksFrom(block, "drive"),
      figma: linksFrom(block, "figma"),
      photos: linksFrom(block, "fotos"),
      accesses: linksFrom(block, "acessos"),
      products: linksFrom(block, "produtos"),
      whatsappUrl: group?.url ?? null,
    };
  });
}

function initials(name: string) {
  const words = name.match(/[\p{L}\p{N}]+/gu) ?? [];
  return words.slice(0, 2).map((word) => word[0].toUpperCase()).join("") || "CL";
}

function accessCategory(label: string) {
  const value = label.toLocaleLowerCase("pt-BR");
  if (value.includes("wordpress")) return "wordpress";
  if (value.includes("cloudflare")) return "cloudflare";
  if (value.includes("hospedagem") || value.includes("turbo") || value.includes("vercel")) return "hosting";
  return "custom";
}

async function syncClient(db: Prisma.TransactionClient, source: SourceClient) {
  const existing = await db.client.findFirst({ where: { name: source.name }, orderBy: { createdAt: "asc" } });
  const client = existing
    ? await db.client.update({
        where: { id: existing.id },
        data: { initials: initials(source.name), tipoContrato: "FIXO", status: "ATIVO", whatsappUrl: source.whatsappUrl },
      })
    : await db.client.create({
        data: { name: source.name, initials: initials(source.name), tipoContrato: "FIXO", status: "ATIVO", whatsappUrl: source.whatsappUrl },
      });

  const tree = await db.linkTree.upsert({
    where: { clientId: client.id },
    update: {},
    create: { clientId: client.id },
  });

  const items = [
    ...source.drive.map((item) => ({ ...item, category: "drive" })),
    ...source.figma.map((item) => ({ ...item, category: "figma" })),
    ...source.photos.map((item) => ({ ...item, category: "photos" })),
    ...source.products.map((item) => ({ ...item, category: "product" })),
    ...source.accesses.map((item) => ({ ...item, category: accessCategory(item.label) })),
  ];

  // Os links vêm diretamente da central; substituímos somente a árvore deste cliente.
  await db.linkTreeItem.deleteMany({ where: { linkTreeId: tree.id } });
  if (items.length) {
    await db.linkTreeItem.createMany({
      data: items.map((item, order) => ({
        linkTreeId: tree.id,
        category: item.category,
        label: item.label,
        url: item.url,
        username: item.username,
        secret: item.secret,
        order,
      })),
    });
  }

  // Produtos também ficam disponíveis para o Kanban. Não removemos produtos já associados a tarefas.
  for (const product of source.products) {
    const current = await db.product.findFirst({ where: { clientId: client.id, name: product.label } });
    if (current) {
      await db.product.update({ where: { id: current.id }, data: { figmaUrl: product.url } });
    } else {
      await db.product.create({ data: { clientId: client.id, name: product.label, figmaUrl: product.url } });
    }
  }

  return { name: client.name, links: items.length, products: source.products.length };
}

async function main() {
  const sourceFile = process.argv[2];
  if (!sourceFile) throw new Error("Uso: npm run clients:import -- ../central-de-clientes-nevel.html");
  const html = await readFile(path.resolve(process.cwd(), sourceFile), "utf8");
  const clients = parseCentral(html);
  if (!clients.length) throw new Error("A central não possui clientes para importar.");

  if (process.argv.includes("--dry-run")) {
    const links = clients.reduce((total, client) => total + client.drive.length + client.figma.length + client.photos.length + client.accesses.length + client.products.length, 0);
    const products = clients.reduce((total, client) => total + client.products.length, 0);
    console.log(`Prévia da central: ${clients.length} clientes, ${products} produtos e ${links} links prontos para importação.`);
    return;
  }

  const summary = await prisma.$transaction(async (db) => {
    const result = [];
    for (const client of clients) result.push(await syncClient(db, client));
    return result;
  });
  const links = summary.reduce((total, client) => total + client.links, 0);
  const products = summary.reduce((total, client) => total + client.products, 0);
  console.log(`Central importada: ${summary.length} clientes, ${products} produtos e ${links} links organizados.`);
}

main()
  .catch((error: unknown) => { console.error(error); process.exitCode = 1; })
  .finally(async () => prisma.$disconnect());
