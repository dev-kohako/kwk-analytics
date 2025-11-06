# 🧭 Architecture Decision Record (ADR)

## 📘 Projeto
KWK Analytics — Frontend (Nola Challenge)

---

## 1. Contexto

O desafio propõe a criação de uma plataforma de analytics no-code para gestores de restaurantes.
O frontend deve oferecer uma experiência fluida, responsiva e acessível, suportando dashboards personalizados e comparações entre períodos.

---

## 2. Decisões Tomadas

### 2.1 Stack Base
- **Next.js 15 (App Router)** foi escolhido pelo suporte a Server Components, caching nativo e performance out-of-the-box.
- **React 18 + TypeScript** garantem tipagem forte, produtividade e legibilidade.

### 2.2 Comunicação com o Backend
- **Apollo Client (GraphQL)** substitui REST, permitindo queries dinâmicas (Pivot Builder) e cache normalizado.
- Os schemas GraphQL são gerados automaticamente via **GraphQL Codegen**, garantindo sincronização tipada com o backend.

### 2.3 Gerenciamento de Estado
- **Zustand** foi adotado em vez de Redux pela simplicidade e ausência de boilerplate.
- Estados globais: filtros ativos, dashboards e preferências do usuário.

### 2.4 UI e Componentização
- **Shadcn/UI + TailwindCSS** fornecem consistência visual e acessibilidade (WCAG-friendly).
- Componentes divididos em:
  - `/dashboard` → específicos da feature
  - `/charts` → visualização de dados (Bar, Line, Pie)
  - `/ui` → base compartilhada (Button, Card, Input, etc.)

### 2.5 Organização de Código
- Pastas por responsabilidade, não por tipo técnico.
- Hooks separados de componentes, garantindo testabilidade.
- Tipos e validações isolados para reuso e consistência.

### 2.6 Performance
- Uso de `next/dynamic` para import assíncrono de gráficos.
- Cache Apollo para evitar roundtrips.
- Skeleton loaders e memoização (`useMemo`, `React.memo`) nos gráficos e listas.
- Paginação server-side em consultas pivot.

### 2.7 UX e Acessibilidade
- Layout **mobile-first** e **sem scroll horizontal**.
- `aria-label`, `aria-sort` e foco visível em todos os controles.
- Feedback visual para loading, erro e vazio.
- Dark mode com persistência via `ThemeProvider`.

### 2.8 Testabilidade
- Planejado para **React Testing Library + Jest**, com mocks Apollo.
- Hooks unit testáveis (useExplore, useInsights, useDashboardById).
- Estrutura compatível com CI (GitHub Actions ou Bun test).

### 2.9 Escalabilidade
- Cada módulo pode ser convertido em microfrontend (dashboard, insights, explore).
- O uso de GraphQL permite evolução sem breaking changes.
- Tipos compartilhados garantem integração consistente.

---

## 3. Alternativas Consideradas

| Alternativa | Motivo de Descarte |
|--------------|--------------------|
| Redux Toolkit | Overhead para estado simples |
| Chakra UI / MUI | Menor flexibilidade visual e maior bundle |
| REST API | Não atende pivot dinâmico |
| Context API pura | Re-renderizações desnecessárias |
| React Query | Incompatível com GraphQL Codegen e cache Apollo já existente |

---

## 4. Trade-offs

- **Apollo Client**: poderoso mas aumenta bundle inicial — mitigado com `ssr: false` em páginas grandes.
- **Next.js App Router**: curva de aprendizado maior, mas simplifica rotas dinâmicas e layouts.
- **Tailwind + Shadcn**: alta produtividade, mas depende de padronização de design tokens (adotado internamente).

---

## 5. Resultado Esperado

- Performance consistente (< 1s em consultas pivot).
- UI fluida e acessível em qualquer dispositivo.
- Estrutura escalável, testável e compreensível.
- Código limpo, com responsabilidades bem delimitadas.

---

## 6. Próximos Passos

- [ ] Adicionar modo de compartilhamento público (tokens read-only)
- [ ] Implementar editor visual de dashboards (drag & drop)
- [ ] Adicionar cache persistente (IndexedDB)
- [ ] Implementar testes automatizados e CI
- [ ] Adicionar internacionalização (i18n)

---

## 7. Conclusão

A arquitetura prioriza **clareza**, **usabilidade** e **testabilidade**, refletindo o princípio do desafio:
> "Queremos ver como você pensa, não apenas como você codifica."

---

🧑‍💻 **Autor:** Joseph Kawe — KWK Tech  
📅 **Data:** 05/11/2025  
📜 **Licença:** MIT