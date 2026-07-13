# POC Journal

Paper trade journal automático para a estratégia POC POC MAX v2.

## Deploy (Railway)

1. Cria um projecto em [railway.app](https://railway.app)
2. Liga este repositório
3. O Railway detecta o `railway.toml` e faz deploy automaticamente
4. Copia o URL público gerado (ex: `https://poc-journal.up.railway.app`)

## Configurar o TradingView

Em cada coin (BTCUSDT.P, ETHUSDT.P, etc.):

1. **Add Alert** no indicador POC POC MAX v2
2. Condition: **Any alert() function call**
3. Interval: **30m**
4. Em **Notifications → Webhook URL**: cola o teu URL + `/webhook`
   - Ex: `https://poc-journal.up.railway.app/webhook`
5. A mensagem já vem configurada automaticamente pelo indicador (JSON com side, entry, tp, sl)

## Variáveis de ambiente (opcionais)

| Variável | Descrição | Default |
|---|---|---|
| `WEBHOOK_SECRET` | Segredo para proteger o endpoint | `""` (sem protecção) |
| `DB_PATH` | Caminho do ficheiro SQLite | `journal.db` |

## API

- `POST /webhook` — recebe alertas do TradingView
- `GET /api/trades` — todos os trades
- `GET /api/stats` — estatísticas e equity curve
- `GET /api/open` — trades abertos
- `GET /` — dashboard
