# Checklist de testes pós-alterações (produção)

Use este checklist para validar o sistema após as correções da auditoria. Execute em ambiente de homologação antes de subir para produção.

---

## 1. Autenticação e perfil

- [ ] **Login com usuário sem role:** Fazer login com usuário que não tem nenhum role (SINDICO, FINANCEIRO, etc.). Deve aparecer mensagem amigável (ex.: "Seu perfil ainda não foi configurado...") e **não** apenas `?error=no_role` na URL sem texto.
- [ ] **Login normal:** Login com síndico e com usuário financeiro continua redirecionando corretamente para dashboard/área correspondente.

---

## 2. Condomínio obrigatório (middleware requireCondominium)

- [ ] **Síndico/Financeiro sem condominiumId:** Se existir um usuário com role SINDICO ou FINANCEIRO mas **sem** `condominium_id` (ex.: em banco de teste), ao acessar rotas como `/sindico/dashboard` ou `/financeiro/entradas` deve retornar 400 (ou redirect com erro), e **não** permitir ver dados de outro condomínio.
- [ ] **Usuário normal com condominiumId:** Acesso a `/sindico/*` e `/financeiro/*` funciona normalmente quando o usuário tem `condominium_id` preenchido.

---

## 3. Rotas com :id (validação numérica)

- [ ] **ID inválido:** Acessar uma rota que usa `:id` com valor não numérico (ex.: `/financeiro/saidas/abc` ou `/financeiro/saidas/0`). Deve retornar 400 (Bad Request), não 500.
- [ ] **ID válido:** Rotas como `/financeiro/saidas/1`, `/sindico/ocorrencias/1` continuam funcionando quando o id é número válido e o recurso existe.

---

## 4. Relatórios (financeiro)

- [ ] **Gerar relatório:** Gerar um relatório em Financeiro → Relatórios. Após o sucesso, a URL de redirect **não** deve conter caminho completo do arquivo (ex.: `C:\...\uploads\...`). Deve usar apenas nome do arquivo (ex.: `?success=generated&file=nome-do-arquivo.pdf`).
- [ ] **Visualizar relatório:** Clicar em "Visualizar" em um relatório listado. O PDF deve abrir no navegador (Content-Disposition: inline).
- [ ] **Download relatório:** Clicar em "Download". O PDF deve ser baixado (Content-Disposition: attachment).
- [ ] **Segurança:** Tentar acessar `/financeiro/relatorios/visualizar?file=../../../etc/passwd` (ou path traversal). Deve retornar 403 ou 404, não servir arquivo fora da pasta de relatórios.

---

## 5. Financeiro – saídas e entradas

- [ ] **Aprovar saída:** Aprovar uma saída pendente. Deve funcionar e não quebrar (validateCondominiumOwnership usa whitelist; tabelas `financial_exits` e `financial_entries` estão permitidas).
- [ ] **Verificar / receber / pagar:** Fluxos que usam `validateCondominiumOwnership` (ex.: verificar saída, receber entrada, pagar saída) continuam funcionando para recursos do condomínio do usuário e retornam 403/404 para recurso de outro condomínio (se testar com id de outro condomínio).

---

## 6. Taxas (inadimplência)

- [ ] **Marcar taxa como paga:** Marcar uma taxa como paga (com comprovante). Deve atualizar saldo/entradas e a taxa deve constar como paga.
- [ ] **Pagar taxa sem comprovante:** Tentar enviar o formulário de "Pagar taxa" **sem** anexar PDF. Deve exibir erro e **não** concluir o pagamento.
- [ ] **Criar/editar taxa quando já existe taxa paga:** Se houver taxa paga para o mesmo apartamento/mês/ano, o fluxo de criar/editar deve reabrir essa taxa (conforme correção) e permitir a atualização.

---

## 7. Inicialização do servidor

- [ ] **Banco indisponível:** Com o banco parado ou `.env` com credenciais erradas, ao subir o servidor (`npm start` ou `node src/server.js`), o processo deve **encerrar com código 1** e **não** subir o HTTP server. Log deve indicar falha na inicialização do banco/correções.

---

## 8. Scripts e arquivos

- [ ] **Script one-off:** Se precisar rodar o script de constraint: a partir da **raiz** do projeto, `node scripts/fix_monthly_closures_constraint.js`. Deve conectar no banco (usando `.env` da raiz) e executar sem erro.
- [ ] **Stackdump:** O arquivo `bash.exe.stackdump` (se ainda existir na pasta) está no `.gitignore` e não deve ser commitado. Pode ser apagado manualmente.

---

## 9. Resumo rápido (smoke test)

1. Login com síndico → dashboard sindico.
2. Ir em Financeiro → Entradas/Saídas → listar e abrir um item por id.
3. Financeiro → Relatórios → gerar um relatório → visualizar e download.
4. Sindico → Ocorrências (ou tarefas) → abrir uma por id.
5. Tentar URL com id inválido (ex.: `/financeiro/saidas/xyz`) → deve dar 400.

Se todos os itens acima passarem, as alterações críticas e de alto impacto estão consistentes. Recomenda-se rodar também a suíte de testes automatizados (`npm test` na pasta `tests/`, se configurado) antes de liberar para produção.
