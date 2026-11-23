# VOD Sync

Extensão de navegador para descobrir a **minutagem equivalente** de um mesmo vídeo em origens diferentes (YouTube, Twitch, Kick etc.).

Útil quando o mesmo conteúdo existe em mais de um lugar com cortes diferentes. Por exemplo: a VOD da Twitch tem melhor qualidade, mas alguns trechos ficam sem áudio por direitos autorais, e o vídeo do YouTube, que é cortado, tem o áudio completo. Com a extensão você sabe exatamente onde ir em cada um.

## Funcionalidades

- Vários vídeos salvos, cada um com um título só para identificação
- Quantas origens quiser (YouTube, Twitch, Kick ou Outro), cada uma com título opcional
- Conversão da minutagem atual para todas as outras origens, com botão **Copiar**
- Horas e minutos em campos separados
- Switch **Usar segundos**, desligado por padrão
- Dados salvos automaticamente no navegador, sem servidor e sem conta
- Sem dependências, sem build

## Instalação

### Chrome / Edge / Brave

1. Extraia o `vod-sync.zip` em uma pasta.
2. Abra `chrome://extensions` (ou `edge://extensions`).
3. Ative o **Modo do desenvolvedor**.
4. Clique em **Carregar sem compactação** e selecione a pasta.
5. Fixe o ícone da extensão na barra do navegador.

### Firefox

1. Extraia o `vod-sync.zip` em uma pasta.
2. Abra `about:debugging` e vá em **Este Firefox**.
3. Clique em **Carregar extensão temporária** e selecione o arquivo `manifest.json`.

No Firefox, extensões temporárias somem ao fechar o navegador e precisam ser carregadas de novo.

### Atualizar

Extraia a nova versão por cima da pasta antiga e clique em **Recarregar** na página de extensões. Os dados salvos são mantidos.

## Como usar

### 1. Origens e início

Clique em **+ Adicionar origem** para cada lugar onde o vídeo existe. Em cada linha, escolha a plataforma, dê um título (opcional) e informe o **início**.

O início é o **mesmo ponto do conteúdo** em cada origem. Exemplo:

| Origem  | Início     |
|---------|------------|
| YouTube | 0 h 00 min |
| Twitch  | 3 h 48 min |

Isso significa que o início da Parte 2 no YouTube é o mesmo momento que 3 h 48 min na VOD da Twitch.

### 2. Minutagem atual

Escolha a origem que você está assistindo e digite a minutagem em que está.

### 3. Resultado

A extensão mostra a minutagem correspondente em todas as outras origens.

## Segundos

O switch **Usar segundos** adiciona uma terceira caixa `s` em cada tempo e passa a mostrar os segundos no resultado.

- Com o switch desligado, os segundos são ignorados no cálculo, mesmo que já tenham sido digitados antes.
- Ao ligar de novo, os valores digitados voltam.

## Limitações

- **Os cortes mudam o deslocamento.** Se o vídeo cortado tiver trechos removidos no meio, a diferença entre as origens muda ao longo do vídeo e o cálculo só é exato perto do ponto de ancoragem. Nesse caso, crie outro vídeo salvo com um novo par de inícios (por exemplo, um por parte ou por trecho).
- As minutagens são digitadas manualmente. A extensão não lê o player das páginas.
- O popup fecha ao clicar fora dele, mas tudo é salvo a cada tecla digitada.

## Estrutura do projeto

```
vod-sync/
├── manifest.json   Configuração da extensão (Manifest V3)
├── popup.html      Interface
├── popup.css       Estilos
├── popup.js        Lógica, cálculo e armazenamento
└── README.md
```

## Privacidade

Tudo fica salvo localmente no navegador, em `chrome.storage.local`. A extensão pede apenas a permissão `storage` e não faz nenhuma requisição de rede.
