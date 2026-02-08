# Graphify Pro - Design System Context

Este documento define a identidade visual e os padrões de interface do Graphify Pro para replicação em futuros projetos.

## 1. Filosofia de Design
- **Estética:** Neomorphic Dark Tech / Minimalismo Científico.
- **Atmosfera:** Profissional, imersiva e de alta performance.
- **Princípios:** Espaçamento generoso, contrastes sutis em elementos de interface e cores vibrantes apenas em dados (gráficos/acentos).

## 2. Paleta de Cores (Hex)
| Elemento | Hex | Aplicação |
| :--- | :--- | :--- |
| **Primary** | `#256af4` | Ações principais, ícones ativos, botões de destaque. |
| **Background** | `#101622` | Fundo principal da aplicação. |
| **Surface** | `#1e1e1e` | Cards, modais e barras de entrada (com opacidade 80-90%). |
| **Charcoal** | `#121212` | Fundo do canvas/gráfico para contraste com a interface. |
| **Bordas** | `rgba(255,255,255,0.05)` | Bordas finas (1px) para separação sutil. |
| **Grid Line** | `#2a2a2a` | Linhas de grade e guias secundárias. |

## 3. Tipografia
- **Display/UI:** `Inter` (Sans-serif). Pesos: 300 (Light), 400 (Regular), 600 (Semi-bold), 700 (Bold).
- **Dados/Math:** `Monaco` ou `Consolas` (Monospace). Usado para expressões, coordenadas e logs.
- **Escalabilidade:** Títulos em 20px, texto padrão 14px, legendas/HUD 10px.

## 4. Componentes e Padrões Visuais

### Glassmorphism (Efeito Vidro)
Todos os elementos flutuantes devem usar:
- `backdrop-blur(12px)` a `24px`.
- Fundo `bg-surface` com opacidade variável (`/80` ou `/90`).
- Bordas de `1px` com `white/10` ou `white/5`.

### Bordas e Cantos
- **Raio Padrão:** `rounded-xl` (12px) para inputs, `rounded-2xl` (16px) para cards, `rounded-3xl` (24px) para modais.
- **Bordas de Destaque:** Para estados de foco ou seleção, use a cor `primary` com `glow` (box-shadow suave).

### Iconografia
- **Fonte:** `Material Symbols Outlined`.
- **Configuração:** `FILL 0`, `wght 400`, `GRAD 0`, `opsz 24`.
- **Interação:** Ícones devem ter transição de cor (`duration-200`) e leve escala (`active:scale-95`).

## 5. Efeitos de Interface (Tailwind Custom)
- **Glow Focus:** `box-shadow: 0 0 15px rgba(37, 106, 244, 0.3); border-color: #256af4;`
- **Animações:** 
  - `fade-in`: 200ms para novos elementos.
  - `slide-in-from-top-4`: Para cards de insight e menus.
  - `pulse`: Sutil em estados de carregamento de IA.

## 6. Layout
- **Sidebar:** Fixa à esquerda (72 unidades/288px), fundo sólido para ancoragem.
- **Canvas:** Área de ocupação máxima, fundo escuro profundo.
- **HUDs:** Controles flutuantes posicionados nos cantos inferiores com sombra projetada (`shadow-2xl`).
