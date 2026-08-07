import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DESIGN_COLUMNS = [
  { key: "EM_PRODUCAO",       label: "Em Produção",          tone: "doing"  },
  { key: "APROVACAO_INTERNA", label: "Aprovação Interna",    tone: "review" },
  { key: "APROVACAO_CLIENTE", label: "Aprovação do Cliente", tone: "review" },
  { key: "ALTERACAO",         label: "Alteração",            tone: "warn"   },
  { key: "FINALIZADO",        label: "Finalizado",           tone: "done"   },
];

const WEB_COLUMNS = [
  { key: "PROPAGACAO_DNS",    label: "Propagação de DNS",    tone: "info"   },
  { key: "IMPLEMENTACAO",     label: "Implementação",        tone: "doing"  },
  { key: "OTIMIZACAO",        label: "Otimização",           tone: "doing"  },
  { key: "APROVACAO_INTERNA", label: "Aprovação Interna",    tone: "review" },
  { key: "APROVACAO_CLIENTE", label: "Aprovação do Cliente", tone: "review" },
  { key: "ALTERACAO",         label: "Alteração",            tone: "warn"   },
  { key: "FINALIZADO",        label: "Finalizado",           tone: "done"   },
];

const CLIENT_DEFAULT_COLUMNS = [
  { key: "PENDENTES",     label: "Pendentes",     tone: "neutral" },
  { key: "PARA_PRODUCAO", label: "Para produção", tone: "info"    },
  { key: "EM_PRODUCAO",   label: "Em produção",   tone: "doing"   },
  { key: "APROVACAO",     label: "Aprovação",     tone: "review"  },
  { key: "FINALIZADO",    label: "Finalizado",    tone: "done"    },
];

async function seedColumns(teamId: string, columns: { key: string; label: string; tone: string }[]) {
  await prisma.teamStatus.createMany({
    data: columns.map((col, index) => ({
      teamId, key: col.key, label: col.label, tone: col.tone, order: (index + 1) * 1000,
    })),
  });
}

async function main() {
  // Limpa tudo (dev/staging)
  await prisma.card.deleteMany();
  await prisma.teamStatus.deleteMany();
  await prisma.demandType.deleteMany();
  await prisma.product.deleteMany();
  await prisma.linkTreeItem.deleteMany();
  await prisma.linkTree.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.team.deleteMany();
  await prisma.person.deleteMany();
  await prisma.client.deleteMany();

  // ------------------------- Times operacionais
  const design = await prisma.team.create({
    data: { slug: "design", name: "Design", kind: "TEAM", order: 1 },
  });
  await seedColumns(design.id, DESIGN_COLUMNS);

  const web = await prisma.team.create({
    data: { slug: "web-design", name: "Web Design", kind: "TEAM", order: 2 },
  });
  await seedColumns(web.id, WEB_COLUMNS);

  // ------------------------- Pessoas
  const gabriel = await prisma.person.create({ data: { name: "Gabriel Alves", email: "gabriellves12@gmail.com", initials: "GA", color: "av-1", role: "admin" } });
  const jonathan = await prisma.person.create({ data: { name: "Jonathan Wallyce", email: "contatojonathanwallyce@gmail.com", initials: "JW", color: "av-2", role: "manager" } });
  const rubens  = await prisma.person.create({ data: { name: "Rubens Soares", email: "ei.designermkt@gmail.com", initials: "RS", color: "av-2", role: "member" } });
  const pedro   = await prisma.person.create({ data: { name: "Pedro Henriquie", email: "ph24402@gmail.com", initials: "PH", color: "av-3", role: "member" } });
  const joao    = await prisma.person.create({ data: { name: "João Victor", email: "joaovicrengel@gmail.com", initials: "JV", color: "av-1", role: "member" } });

  // Composição operacional específica de cada quadro
  for (const [i, p] of [rubens, jonathan, pedro, gabriel].entries()) {
    await prisma.teamMember.create({ data: { teamId: design.id, personId: p.id, order: i } });
  }
  await prisma.teamMember.create({ data: { teamId: web.id, personId: joao.id, order: 0 } });

  // ------------------------- Clientes + árvore de links
  const now = new Date();
  const monthsAgo = (n: number) => new Date(now.getFullYear(), now.getMonth() - n, 12);

  const fe = await prisma.client.create({ data: {
    name: "Androclinic & Menopausa", initials: "AM", portalUserLimit: 5,
    tipoContrato: "FIXO", status: "ATIVO",
    startDate: monthsAgo(14),
    contractUrl: "https://drive.google.com/file/d/contrato-fe-alves",
    contractMonths: 12,
    whatsappUrl: "https://chat.whatsapp.com/grupo-fe-alves",
  } });
  const studio = await prisma.client.create({ data: {
    name: "Jéssica Abreu", initials: "JA", portalUserLimit: 5,
    tipoContrato: "FIXO", status: "ATIVO",
    startDate: monthsAgo(8),
    contractUrl: "https://drive.google.com/file/d/contrato-studio-nova",
    contractMonths: 6,
    whatsappUrl: "https://chat.whatsapp.com/grupo-studio-nova",
  } });
  const casaVerde = await prisma.client.create({ data: {
    name: "Galla Consultoria", initials: "GC", portalUserLimit: 5,
    tipoContrato: "FREELA", status: "ATIVO",
    startDate: monthsAgo(3),
    whatsappUrl: "https://chat.whatsapp.com/grupo-casa-verde",
  } });
  const belaVida = await prisma.client.create({ data: {
    name: "Elias Maman", initials: "EM", portalUserLimit: 5,
    tipoContrato: "FREELA", status: "ENCERRADO",
    startDate: monthsAgo(20), endDate: monthsAgo(4),
    contractUrl: "https://drive.google.com/file/d/contrato-bela-vida",
    contractMonths: 12,
  } });

  // Um acesso isolado para cada uma das quatro empresas
  await prisma.person.createMany({ data: [
    { name: "Cliente Androclinic & Menopausa", email: "cliente.androclinic@thinkcontrol.com.br", initials: "AM", role: "client", clientId: fe.id },
    { name: "Cliente Jéssica Abreu", email: "cliente.jessica@thinkcontrol.com.br", initials: "JA", role: "client", clientId: studio.id },
    { name: "Cliente Galla Consultoria", email: "cliente.galla@thinkcontrol.com.br", initials: "GC", role: "client", clientId: casaVerde.id },
    { name: "Cliente Elias Maman", email: "cliente.elias@thinkcontrol.com.br", initials: "EM", role: "client", clientId: belaVida.id },
  ] });

  // Um quadro (kind=CLIENT) por cliente com as colunas padrão
  for (const [i, c] of [fe, studio, casaVerde, belaVida].entries()) {
    const slug = c.name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const team = await prisma.team.create({
      data: { slug: `cliente-${slug}`, name: c.name, kind: "CLIENT", clientId: c.id, order: 100 + i },
    });
    await seedColumns(team.id, CLIENT_DEFAULT_COLUMNS);
  }

  await prisma.product.createMany({ data: [
    { clientId: fe.id, name: "Protocolo Origem", driveUrl: "https://drive.google.com/drive/folders/protocolo-origem", figmaUrl: "https://figma.com/file/protocolo-origem", photosUrl: "https://drive.google.com/drive/folders/fotos-fe-alves" },
    { clientId: fe.id, name: "Método Essência", driveUrl: "https://drive.google.com/drive/folders/metodo-essencia", figmaUrl: "https://figma.com/file/metodo-essencia", photosUrl: "https://drive.google.com/drive/folders/fotos-fe-alves" },
    { clientId: studio.id, name: "Coleção Verão", driveUrl: "https://drive.google.com/pasta-verao", figmaUrl: "https://figma.com/verao" },
    { clientId: studio.id, name: "Coleção Outono", driveUrl: "https://drive.google.com/pasta-outono", figmaUrl: "https://figma.com/outono" },
    { clientId: casaVerde.id, name: "Institucional" },
    { clientId: belaVida.id, name: "Bela Vida" },
  ]});

  await prisma.demandType.createMany({ data: [
    { name: "Criativos de Captura", prefix: "CC", variationMode: "FIXED", variations: JSON.stringify(["Feed", "Storie"]), order: 1 },
    { name: "Criativos de Vendas", prefix: "CV", variationMode: "FIXED", variations: JSON.stringify(["Feed", "Storie"]), order: 2 },
    { name: "Criativos de Lembrete", prefix: "CL", variationMode: "FIXED", variations: JSON.stringify(["Feed", "Storie"]), order: 3 },
    { name: "Carrossel", prefix: "C", variationMode: "SLIDES", variations: "[]", order: 4 },
    { name: "Social Media", prefix: "SM", variationMode: "FIXED", variations: JSON.stringify(["Feed"]), order: 5 },
    { name: "Thumbnail", prefix: "T", variationMode: "FIXED", variations: JSON.stringify(["Thumb"]), order: 6 },
    { name: "Ebook", prefix: "EBOOK", variationMode: "FREE", variations: "[]", order: 7 },
    { name: "Slides", prefix: "S", variationMode: "FREE", variations: "[]", order: 8 },
    { name: "Página de Captura", prefix: "CAPTURA", variationMode: "FIXED", variations: JSON.stringify(["Desktop", "Mobile"]), routeToWeb: true, order: 9 },
    { name: "Página de Vendas", prefix: "VENDAS", variationMode: "FIXED", variations: JSON.stringify(["Desktop", "Mobile"]), routeToWeb: true, order: 10 },
  ]});

  const feTree = await prisma.linkTree.create({ data: { clientId: fe.id } });
  await prisma.linkTreeItem.createMany({
    data: [
      { linkTreeId: feTree.id, category: "drive",      label: "Drive geral",  url: "https://drive.google.com/drive/folders/exemplo", order: 0 },
      { linkTreeId: feTree.id, category: "figma",      label: "Figma – Master", url: "https://figma.com/file/exemplo", order: 1 },
      { linkTreeId: feTree.id, category: "photos",     label: "Fotos (Drive)", url: "https://drive.google.com/drive/folders/fotos", order: 2 },
      { linkTreeId: feTree.id, category: "instagram",  label: "@fealves", url: "https://instagram.com/fealves", observation: "@fealves", order: 3 },
      { linkTreeId: feTree.id, category: "cloudflare", label: "Cloudflare", url: "https://dash.cloudflare.com", observation: "acesso via 1Password", order: 4 },
      { linkTreeId: feTree.id, category: "hosting",    label: "Hostinger", url: "https://hpanel.hostinger.com", observation: "user: fealves", order: 5 },
      { linkTreeId: feTree.id, category: "wordpress",  label: "WP admin", url: "https://fealves.com.br/wp-admin", observation: "user: gabriel", order: 6 },
    ],
  });

  // Produtos (aninhado): duas pastas, cada uma com um figma
  const prodParent = await prisma.linkTreeItem.create({
    data: { linkTreeId: feTree.id, category: "product", label: "Produtos", order: 7 },
  });
  const p1 = await prisma.linkTreeItem.create({
    data: { linkTreeId: feTree.id, category: "product", label: "Coleção Verão", parentId: prodParent.id, order: 0 },
  });
  await prisma.linkTreeItem.createMany({
    data: [
      { linkTreeId: feTree.id, category: "drive", label: "Pasta",  url: "https://drive.google.com/pasta-verao", parentId: p1.id, order: 0 },
      { linkTreeId: feTree.id, category: "figma", label: "Figma",  url: "https://figma.com/verao",             parentId: p1.id, order: 1 },
    ],
  });
  const p2 = await prisma.linkTreeItem.create({
    data: { linkTreeId: feTree.id, category: "product", label: "Coleção Outono", parentId: prodParent.id, order: 1 },
  });
  await prisma.linkTreeItem.createMany({
    data: [
      { linkTreeId: feTree.id, category: "drive", label: "Pasta",  url: "https://drive.google.com/pasta-outono", parentId: p2.id, order: 0 },
      { linkTreeId: feTree.id, category: "figma", label: "Figma",  url: "https://figma.com/outono",              parentId: p2.id, order: 1 },
    ],
  });

  // árvore mínima para os outros clientes
  for (const c of [studio, casaVerde, belaVida]) {
    const t = await prisma.linkTree.create({ data: { clientId: c.id } });
    await prisma.linkTreeItem.createMany({
      data: [
        { linkTreeId: t.id, category: "drive",     label: "Drive",     url: "https://drive.google.com/exemplo", order: 0 },
        { linkTreeId: t.id, category: "figma",     label: "Figma",     url: "https://figma.com/exemplo",       order: 1 },
        { linkTreeId: t.id, category: "instagram", label: `@${c.name.toLowerCase().replace(/\s+/g,"")}`, url: "https://instagram.com", order: 2 },
      ],
    });
  }

  // ------------------------- Cards
  const today = new Date();
  const day = (d: number) => new Date(today.getFullYear(), today.getMonth(), today.getDate() + d);

  // Time Design
  const designCards = [
    // Em Produção
    { title: "Carrossel — 5 dicas de skincare",     clientId: fe.id,      responsibleId: gabriel.id, status: "EM_PRODUCAO",       deadline: day(6),  order: 1000 },
    { title: "Kit de stories · outono",             clientId: studio.id,  responsibleId: pedro.id,   status: "EM_PRODUCAO",       deadline: day(8),  order: 2000 },
    { title: "Identidade visual · fase 1",          clientId: casaVerde.id,responsibleId: rubens.id, status: "EM_PRODUCAO",       deadline: day(12), order: 3000, tipoProjeto: "PADRAO" },
    // Aprovação interna
    { title: "Post institucional · nova sede",      clientId: studio.id,  responsibleId: gabriel.id, status: "APROVACAO_INTERNA", deadline: day(4),  order: 1000 },
    // Aprovação cliente
    { title: "Reels · bastidores do evento",        clientId: fe.id,      responsibleId: gabriel.id, status: "APROVACAO_CLIENTE", deadline: day(5),  order: 1000 },
    { title: "Anúncio Meta · variação B",           clientId: studio.id,  responsibleId: pedro.id,   status: "APROVACAO_CLIENTE", deadline: day(3),  order: 2000 },
    // Alteração
    { title: "Ajustes de tipografia · convite",     clientId: casaVerde.id, responsibleId: rubens.id, status: "ALTERACAO",         deadline: day(2),  order: 1000 },
    // Finalizado
    { title: "Post · dia dos pais",                 clientId: belaVida.id, responsibleId: rubens.id, status: "FINALIZADO",        deadline: day(-8), order: 1000 },
    { title: "Reels · tour pela loja",              clientId: casaVerde.id, responsibleId: gabriel.id, status: "FINALIZADO",       deadline: day(-4), order: 2000 },
    // Atrasados (pendentes materiais)
    { title: "Fotos internas para post institucional", clientId: fe.id,   responsibleId: gabriel.id, status: "EM_PRODUCAO",       deadline: day(-3), order: 4000, pendenteMaterial: true },
    { title: "Aprovação do logo variante escura",   clientId: studio.id,  responsibleId: rubens.id,  status: "APROVACAO_CLIENTE", deadline: day(-1), order: 3000 },
  ];

  for (const c of designCards) {
    await prisma.card.create({
      data: {
        title: c.title, clientId: c.clientId, responsibleId: c.responsibleId,
        status: c.status, teamId: design.id, deadline: c.deadline,
        order: c.order, tipoProjeto: c.tipoProjeto ?? "PADRAO",
        pendenteMaterial: c.pendenteMaterial ?? false,
      },
    });
  }

  // Time Web Design
  const webCards = [
    { title: "Landing lançamento · Fê Alves",       clientId: fe.id,       responsibleId: gabriel.id, status: "IMPLEMENTACAO",     deadline: day(10), order: 1000, tipoProjeto: "PAGINA" },
    { title: "Site institucional · Studio Nova",    clientId: studio.id,   responsibleId: pedro.id,   status: "PROPAGACAO_DNS",    deadline: day(14), order: 1000, tipoProjeto: "PAGINA" },
    { title: "One-page evento · Casa Verde",        clientId: casaVerde.id, responsibleId: rubens.id, status: "OTIMIZACAO",        deadline: day(6),  order: 1000, tipoProjeto: "PAGINA" },
    { title: "Blog · Bela Vida",                    clientId: belaVida.id,  responsibleId: gabriel.id, status: "APROVACAO_CLIENTE", deadline: day(3),  order: 1000, tipoProjeto: "PAGINA" },
    { title: "Loja Shopify (migração)",             clientId: fe.id,       responsibleId: rubens.id,  status: "ALTERACAO",         deadline: day(-2), order: 1000, tipoProjeto: "PAGINA" },
    { title: "Site portfolio",                      clientId: studio.id,   responsibleId: gabriel.id, status: "FINALIZADO",        deadline: day(-15), order: 1000, tipoProjeto: "PAGINA" },
  ];

  for (const c of webCards) {
    await prisma.card.create({
      data: {
        title: c.title, clientId: c.clientId, responsibleId: c.responsibleId,
        status: c.status, teamId: web.id, deadline: c.deadline,
        order: c.order, tipoProjeto: c.tipoProjeto ?? "PAGINA",
      },
    });
  }

  console.log("✓ Seed concluído.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
