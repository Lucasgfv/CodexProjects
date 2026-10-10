# Design System — Nexo Contábil

Este documento é a referência visual única do projeto. Antes de criar ou alterar uma tela, consulte os tokens em `src/app/globals.css`, o mapeamento do Tailwind em `tailwind.config.ts` e os padrões abaixo.

## 1. Princípios visuais

- **Clareza primeiro:** interfaces leves, com hierarquia forte e pouco ruído visual.
- **Verde musgo como ação:** use a cor primária em ações, foco e seleção; não como decoração excessiva.
- **Superfícies discretas:** fundo `canvas`, painéis brancos, bordas suaves e sombra apenas quando ajuda a separar planos.
- **Geometria coerente:** controles com `rounded-control`, painéis com `rounded-panel` e indicadores com raio total.
- **Densidade confortável:** controles têm 44 px de altura por padrão, adequados para toque e desktop.

## 2. Fonte da verdade

Os valores base ficam como CSS Custom Properties no `:root` de `src/app/globals.css`. O `tailwind.config.ts` apenas expõe esses valores como utilitários. Não repita um hexadecimal em um componente quando já existir um token semântico equivalente.

Exemplos:

```tsx
<section className="surface-card p-6">
  <h2 className="text-xl font-semibold text-ink">Resumo</h2>
  <p className="mt-2 text-sm text-muted">Informações atualizadas.</p>
</section>
```

```css
.custom-element {
  color: var(--color-text-muted);
  border-color: var(--color-border);
  border-radius: var(--radius-control);
}
```

## 3. Tokens

### Cores

| Papel | Tailwind | CSS variable | Uso |
| --- | --- | --- | --- |
| Fundo da aplicação | `bg-canvas` | `--color-canvas` | Página e áreas externas |
| Superfície | `bg-surface` | `--color-surface` | Cards, menus, modais |
| Texto principal | `text-ink` | `--color-text` | Títulos e conteúdo |
| Texto secundário | `text-muted` | `--color-text-muted` | Descrições e metadados |
| Borda | `border-line` | `--color-border` | Divisores e contornos |
| Ação primária | `bg-moss` | `--color-primary` | CTA, seleção e foco |
| Apoio | `sage` | `--color-secondary` | Categorias e gráficos |
| Destaque | `lavender` | `--color-accent` | Categorias secundárias |
| Sucesso | `success` | `--color-success` | Confirmação e ativo |
| Alerta | `warning` | `--color-warning` | Atenção não bloqueante |
| Erro | `danger` | `--color-danger` | Falha, inválido, destrutivo |
| Informação | `info` | `--color-info` | Ajuda e estado informativo |

Cada cor semântica tem uma versão `-subtle` em CSS para fundos. Texto branco só deve ser usado quando o fundo colorido mantiver contraste WCAG AA.

### Tipografia

- Família de interface: `font-sans` — Manrope, Segoe UI Variable, Segoe UI, sans-serif.
- Documentos formais: `font-document` — Georgia, Times New Roman, serif.
- Escala: `text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`, `text-3xl`, `text-4xl`.
- Pesos: 400 para corpo, 500 para navegação/legendas, 600 para títulos e botões, 700 apenas para cabeçalhos compactos.
- Títulos usam tracking negativo com moderação; corpo e tabelas usam tracking normal.

### Espaçamento e layout

- Grid base: 4 px. Prefira a escala padrão do Tailwind (`1` = 4 px, `2` = 8 px, `3` = 12 px, `4` = 16 px...).
- Container principal: classe `page-container`, largura máxima de 1480 px.
- Respiros usuais: 16–24 px dentro de cards; 32–56 px entre blocos; 40–80 px nas extremidades de páginas.
- Breakpoints: `sm` 640 px, `md` 768 px, `lg` 1024 px, `xl` 1280 px, `2xl` 1536 px.
- Comece pelo mobile; adicione mudanças estruturais em `md` ou `lg`.

### Bordas, elevação e movimento

- Controles: `rounded-control` (12 px).
- Painéis: `rounded-panel` (18 px).
- Pills: `rounded-full`.
- Sombra discreta: `shadow-subtle`; modal/painel elevado: `shadow-panel`.
- Interações: `duration-fast` (120 ms), `duration-normal` (200 ms), `duration-slow` (300 ms).
- Anime apenas propriedades de baixo custo, como `opacity` e `transform`. O sistema respeita `prefers-reduced-motion` globalmente.

## 4. Componentes essenciais

### Botões

Use as classes compartilhadas, nunca recrie padding, altura e foco em cada tela.

```tsx
<button className="primary-button">Salvar</button>
<button className="secondary-button">Cancelar</button>
<button className="outline-button">Ver detalhes</button>
<button className="danger-button">Excluir</button>
<button className="primary-button" disabled>
  <span aria-hidden className="button-spinner" />
  <span>Salvando…</span>
</button>
```

- Toda ação precisa de `type="button"` ou `type="submit"` explícito.
- Loading mantém a largura do botão, comunica o estado em texto e bloqueia novo envio.
- Ações destrutivas usam `danger-button` e confirmação quando não forem facilmente reversíveis.

### Formulários

```tsx
<label className="field-label" htmlFor="nome">Nome</label>
<input className="field-control" id="nome" />

<label className="field-label" htmlFor="email">E-mail</label>
<input
  aria-describedby="email-error"
  aria-invalid="true"
  className="field-control field-invalid"
  id="email"
/>
<p className="field-error" id="email-error">Informe um e-mail válido.</p>
```

- `field-control` atende input e select; `field-textarea` atende textos longos.
- Erros sempre têm texto explicativo, `aria-invalid` e `aria-describedby`; cor sozinha não basta.
- Checkbox usa `field-checkbox`. Agrupe opções relacionadas com `fieldset` e `legend`.

### Cards, modais, tabelas e status

- Card padrão: `surface-card`; evite cards dentro de cards.
- Modal: `modal-backdrop` + `modal-panel`, com título visível, botão de fechar rotulado, foco inicial e retorno do foco ao fechar.
- Tabela: `data-table`; em telas pequenas, permita rolagem horizontal no contêiner em vez de esmagar colunas.
- Status: `status-badge-success`, `status-badge-warning`, `status-badge-danger` ou `status-badge-info`.
- Use `status-dot` somente junto de texto que explique o estado.

### Ícones

- Biblioteca oficial: `lucide-react`.
- Tamanho comum: 16–20 px em controles, 20–24 px em destaques.
- Stroke comum: 1.7–2.0. Ícones decorativos recebem `aria-hidden="true"`; botões só com ícone precisam de `aria-label`.

## 5. Acessibilidade

- Texto normal deve alcançar contraste WCAG AA de pelo menos 4.5:1; texto grande, 3:1.
- Não remova foco visível. Use as classes de botão/campo ou `focus-visible:shadow-focus`.
- Áreas interativas devem ter no mínimo 44 × 44 px sempre que possível.
- Estruture títulos em ordem lógica e use elementos HTML semânticos.
- Toda imagem informativa precisa de `alt`; imagens decorativas usam `alt=""`.
- Estados não podem depender apenas de cor. Combine texto, ícone ou padrão visual.
- Verifique navegação por teclado, zoom de 200% e `prefers-reduced-motion`.

## 6. Convenções

- Componentes React: `PascalCase`; arquivos de componente: `kebab-case.tsx`.
- Props e funções: `camelCase`.
- Classes globais compartilhadas: nomes semânticos em `kebab-case` (`primary-button`, `surface-card`).
- Variáveis CSS: prefixo por domínio (`--color-*`, `--text-*`, `--radius-*`, `--shadow-*`, `--duration-*`).
- Use `cn()` para variantes condicionais; não concatene classes manualmente.
- Cores específicas de gráficos podem viver perto da configuração do gráfico, mas cores de interface devem usar tokens.

## 7. Como criar uma nova tela

1. Use `page-container` como limite horizontal e `PageHeader` para título, descrição e ação principal.
2. Monte a hierarquia com os tokens e componentes existentes antes de criar uma nova abstração.
3. Reutilize `primary-button`, campos, `surface-card`, tabela e badges.
4. Garanta estados de vazio, carregamento, erro, sucesso, hover, foco e disabled.
5. Teste primeiro em mobile, depois em 768 px, 1024 px e desktop amplo.
6. Rode `pnpm lint`, `pnpm typecheck` e `pnpm build` antes de concluir.

## 8. Como adicionar ou alterar um componente

1. Confirme que o caso não pode ser resolvido por uma variante de componente existente.
2. Adicione novos valores ao `:root` somente se forem reutilizáveis e tiverem função semântica clara.
3. Exponha o token no Tailwind apenas quando ele for usado por classes utilitárias.
4. Defina todos os estados interativos e requisitos de acessibilidade.
5. Documente a nova variante neste arquivo, com um exemplo curto.
6. Evite mudanças globais que alterem telas antigas silenciosamente; faça migrações explícitas e verificáveis.

Valores hard-coded já existentes podem ser migrados gradualmente. Código novo não deve ampliar essa dívida quando houver um token correspondente.
