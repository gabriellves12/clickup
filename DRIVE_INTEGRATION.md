# Google Drive integrado

O painel usa a conta Google de cada pessoa. A lista, o upload e o download obedecem às permissões que esse mesmo e-mail possui no Google Drive.

## Configuração no Google Cloud

1. Crie ou selecione um projeto no [Google Cloud Console](https://console.cloud.google.com/).
2. Em **APIs e serviços**, ative a **Google Drive API**.
3. Em **Tela de consentimento OAuth**, cadastre o app como interno caso todos os e-mails sejam do mesmo Google Workspace. Caso existam contas externas, use o modo externo e inclua os e-mails de teste até a publicação.
4. Em **Credenciais**, crie um **ID do cliente OAuth 2.0** do tipo **Aplicativo da Web**.
5. Em **URIs de redirecionamento autorizados**, informe:

   ```
   https://<dominio-do-painel>/api/integrations/google/drive/callback
   ```

6. No ambiente de deploy, configure:

   ```bash
   GOOGLE_DRIVE_CLIENT_ID="..."
   GOOGLE_DRIVE_CLIENT_SECRET="..."
   GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEY="$(openssl rand -base64 32)"
   GOOGLE_DRIVE_ROOT_FOLDER_ID="10X4Wp_hPFnG57F5EhH8hEETBEVGHRN26"
   ```

7. Aplique a migration e publique. Cada colaborador deverá abrir a aba **Drive** e conectar a mesma conta Google usada para entrar no painel.

## Permissões

- A pasta raiz do Drive continua sendo a fonte de verdade.
- Quem for **Leitor** no Google Drive consegue abrir e baixar.
- Quem for **Editor** consegue também enviar arquivos na pasta permitida.
- O painel não expõe tokens Google ao navegador: o token de renovação é cifrado no banco e usado apenas no servidor.

## Limite de upload inicial

O envio pelo painel aceita arquivos de até 100 MB por vez. Para arquivos maiores, o upload poderá ser evoluído para o protocolo resumível do Google Drive.
