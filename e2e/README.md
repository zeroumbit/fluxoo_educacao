# E2E Fase 1

Esta suíte cobre as superfícies críticas sem exigir dados reais por padrão.

## Rodar smoke tests públicos

```bash
npm run build
npm run test:e2e -- e2e/public-auth.spec.ts
```

## Rodar fluxos autenticados

Defina credenciais de teste com permissões controladas:

```bash
$env:E2E_GESTOR_EMAIL="gestor.teste@exemplo.com"
$env:E2E_GESTOR_PASSWORD="senha"
$env:E2E_PROFESSOR_EMAIL="professor.teste@exemplo.com"
$env:E2E_PROFESSOR_PASSWORD="senha"
npm run build
npm run test:e2e:critical
```

Os testes autenticados ficam pulados quando as variáveis não existem.
