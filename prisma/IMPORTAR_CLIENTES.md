# Importação da Central de Clientes

O importador `import-central-clients.ts` transforma a Central de Clientes em registros do painel.

Ele cria ou atualiza clientes pelo nome e organiza:

- cliente fixo e ativo;
- grupo do WhatsApp;
- links de Drive, Figma, fotos e acessos;
- produtos disponíveis no Kanban.

As senhas e usuários do HTML de origem **não são gravados** no banco nem exibidos no painel. O arquivo de origem deve permanecer fora do deploy e fora do controle de versão.

## Validar o arquivo sem alterar o banco

```bash
npm run clients:import -- ../central-de-clientes-nevel.html --dry-run
```

## Executar a importação

```bash
npm run clients:import -- ../central-de-clientes-nevel.html
```

A operação é transacional: todos os clientes são importados juntos ou nenhuma alteração é aplicada. O importador só substitui a árvore de links dos clientes presentes na central e preserva produtos já associados a tarefas.
