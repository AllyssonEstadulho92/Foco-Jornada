import { useCallback, useEffect, useState } from 'react'
import type { StickSummary, StockMovement } from '../../domain/personalStock/models'
import { useAppServices } from '../providers/AppServicesProvider'

function operationId(): string {
  return globalThis.crypto.randomUUID()
}

function movementLabel(type: StockMovement['type']): string {
  if (type === 'initial_stock') return 'Stock inicial'
  if (type === 'consumption') return 'Utilização'
  if (type === 'restock') return 'Reposição'
  return 'Correção'
}

export function SticksStockPage() {
  const { personalStockService } = useAppServices()
  const [summary, setSummary] = useState<StickSummary | null>(null)
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [quantity, setQuantity] = useState('20')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const reload = useCallback(async () => {
    const [nextSummary, nextMovements] = await Promise.all([
      personalStockService.getSticksSummary(),
      personalStockService.listStickMovements(30),
    ])
    setSummary(nextSummary)
    setMovements(nextMovements)
  }, [personalStockService])

  useEffect(() => {
    void reload().catch((error: unknown) => setMessage(error instanceof Error ? error.message : 'Erro ao carregar o stock.'))
  }, [reload])

  async function run(action: () => Promise<unknown>, success: string) {
    if (busy) return
    setBusy(true)
    setMessage('')
    try {
      await action()
      await reload()
      setMessage(success)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível concluir a operação.')
    } finally {
      setBusy(false)
    }
  }

  const parsedQuantity = Number(quantity)
  const canSubmitQuantity = Number.isSafeInteger(parsedQuantity) && parsedQuantity > 0

  return (
    <section className="personalStockPage sticksStockPage" aria-labelledby="sticks-title">
      <header className="personalStockHeader">
        <span className="eyebrow">STOCK PESSOAL · EXATO</span>
        <h1 id="sticks-title">Sticks glo</h1>
        <p>Um stick é sempre uma unidade inteira. O saldo é reconstruído através do histórico de movimentos.</p>
      </header>

      {message ? <div className="stockMessage" role="status">{message}</div> : null}

      <div className="stockMetricGrid">
        <article className="stockMetric stockMetricPrimary">
          <span>Stock atual</span>
          <strong>{summary?.initialized ? summary.stock : '—'}</strong>
          <small>{summary?.initialized ? 'sticks' : 'Define o stock inicial'}</small>
        </article>
        <article className="stockMetric">
          <span>Utilizados hoje</span>
          <strong>{summary?.initialized ? summary.usedToday : '—'}</strong>
          <small>EXATO</small>
        </article>
        <article className="stockMetric">
          <span>Reconciliação</span>
          <strong>{summary?.ok ? 'OK' : 'INCONSISTÊNCIA'}</strong>
          <small>{summary?.movementCount ?? 0} movimentos</small>
        </article>
      </div>

      {!summary?.initialized ? (
        <section className="stockPanel">
          <h2>Definir stock inicial</h2>
          <p>Este valor cria o primeiro movimento do ledger. Depois disso, as alterações são feitas apenas por novos movimentos.</p>
          <div className="stockInlineForm">
            <label>
              Quantidade
              <input inputMode="numeric" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
            </label>
            <button
              type="button"
              disabled={busy || !canSubmitQuantity}
              onClick={() => void run(
                () => personalStockService.initializeSticks(parsedQuantity, operationId()),
                'Stock inicial guardado e reconciliado.',
              )}
            >
              Criar stock
            </button>
          </div>
        </section>
      ) : (
        <>
          <section className="stockPanel stockActionPanel">
            <div>
              <span className="stockPanelTag">REGISTAR UTILIZAÇÃO</span>
              <h2>Movimento real</h2>
              <p>O botão só confirma depois de a transação IndexedDB terminar.</p>
            </div>
            <button
              type="button"
              className="stockPrimaryAction"
              disabled={busy || (summary.stock ?? 0) <= 0}
              onClick={() => void run(
                () => personalStockService.consumeStick(operationId()),
                '1 stick utilizado. Stock atualizado.',
              )}
            >
              + 1 stick utilizado
            </button>
            <button
              type="button"
              className="stockSecondaryAction"
              disabled={busy}
              onClick={() => void run(
                () => personalStockService.undoLastStick(operationId()),
                'Última utilização anulada através de um movimento de correção.',
              )}
            >
              Desfazer último registo
            </button>
          </section>

          <section className="stockPanel">
            <h2>Adicionar stock</h2>
            <div className="stockInlineForm">
              <label>
                Sticks a adicionar
                <input inputMode="numeric" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
              </label>
              <button
                type="button"
                disabled={busy || !canSubmitQuantity}
                onClick={() => void run(
                  () => personalStockService.restockSticks(parsedQuantity, operationId()),
                  'Reposição adicionada ao ledger.',
                )}
              >
                Adicionar
              </button>
            </div>
          </section>
        </>
      )}

      <section className="stockPanel">
        <div className="stockPanelHeading">
          <div>
            <span className="stockPanelTag">AUDITORIA</span>
            <h2>Histórico de movimentos</h2>
          </div>
          <span className={summary?.ok ? 'stockStatusOk' : 'stockStatusError'}>{summary?.ok ? 'OK' : 'VERIFICAR'}</span>
        </div>

        {movements.length ? (
          <div className="stockLedgerList">
            {movements.map((movement) => (
              <article className="stockLedgerRow" key={movement.id}>
                <div>
                  <strong>{movementLabel(movement.type)}</strong>
                  <small>{new Date(movement.effectiveAt).toLocaleString('pt-PT')}</small>
                </div>
                <div className="stockLedgerMath">
                  <span>{movement.balanceBeforeMinor}</span>
                  <b>{BigInt(movement.quantityMinor) > 0n ? '+' : ''}{movement.quantityMinor}</b>
                  <span>= {movement.balanceAfterMinor}</span>
                </div>
              </article>
            ))}
          </div>
        ) : <p className="stockEmpty">Ainda não existem movimentos.</p>}
      </section>

      <section className="stockProjectionPanel">
        <span>PROJEÇÃO</span>
        <strong>Não existem dados suficientes para calcular este resultado com precisão.</strong>
        <p>Uma média histórica só será apresentada quando existir uma regra de projeção explícita e identificada.</p>
      </section>
    </section>
  )
}
