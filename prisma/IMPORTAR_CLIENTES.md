# Importação da Central de Clientes

O importador `import-central-clients.ts` transforma a Central de Clientes em registros do painel.

Ele cria ou atualiza clientes pelo nome e organiza:

- cliente fixo e ativo;
- grupo do WhatsApp;
- links de Drive, Figma, fotos e acessos;
- produtos disponíveis no Kanban.

Usuários e senhas de acessos técnicos presentes no HTML são importados para os campos de credencial e aparecem apenas para administradores na aba de Clientes, com cópia individual e senha mascarada. Antes de publicar em produção, esses campos devem ser protegidos por criptografia em repouso ou movidos para um cofre de senhas integrado. O arquivo de origem deve permanecer fora do deploy e fora do controle de versão.

## Validar o arquivo sem alterar o banco

```bash
npm run clients:import -- "../central-de-clientes-nevel (1).html" --dry-run
```

## Executar a importação

```bash
npm run clients:import -- "../central-de-clientes-nevel (1).html"
```

A operação é transacional: todos os clientes são importados juntos ou nenhuma alteração é aplicada. O importador só substitui a árvore de links dos clientes presentes na central e preserva produtos já associados a tarefas.
