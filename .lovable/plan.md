## Contexto

Ao analisar o código, descobri que **o gerenciamento de Processadores e Memória RAM já existe** na aba **Configurações** do Admin (`SettingsTab`). Lá já é possível adicionar e remover opções que aparecem nos selects do formulário de produto.

O que **falta** é o equivalente para **Placa de Vídeo**: hoje no cadastro do produto só existe um checkbox "Tem placa de vídeo dedicada", sem campo para informar o **modelo** (ex: RTX 4060, GTX 1650, Radeon RX 6600).

## O que será feito

### 1. Banco de dados
- Adicionar coluna `gpu_options` (jsonb) na tabela `settings` com lista padrão (ex: "GTX 1650", "RTX 3050", "RTX 4060", "Radeon RX 6600").

### 2. Configurações (`SettingsTab`)
- Nova seção **"Opções de Placa de Vídeo"**, idêntica em comportamento às de Processador/RAM (listar, adicionar, remover modelos).
- Adicionar funções `addGPUOption` / `removeGPUOption` / `updateGPUOptions` em `settingsStore.ts`.

### 3. Formulário de produto (`ProductForm`)
- Manter o checkbox "Tem placa de vídeo dedicada".
- Quando marcado, mostrar um **Select com os modelos de GPU** cadastrados em Configurações para escolher o modelo (campo opcional).
- Salvar em `specifications.gpuModel`.

### 4. Filtros e exibição
- Mostrar o modelo da GPU nos detalhes/specs do produto quando preenchido.
- (Filtro por modelo de GPU não será adicionado agora — apenas o filtro existente "apenas com placa dedicada" continua.)

## Observação importante

Se você não estava enxergando a opção de adicionar/remover **Processador** e **RAM**, ela está em **Admin → Configurações**, nas seções "Opções de Processador" e "Opções de Memória RAM". Se preferir, posso também mover/destacar essas seções para ficarem mais visíveis — me avise.

## Arquivos afetados
- migration na tabela `settings`
- `src/lib/settingsStore.ts`
- `src/components/admin/SettingsTab.tsx`
- `src/components/admin/ProductForm.tsx`
- `src/lib/productsStore.ts` (tipo `gpuModel`)
- exibição de specs (ProductDetailsDialog / ProductCard se aplicável)
