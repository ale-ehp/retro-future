# vendor

three.js r184 e i suoi moduli addons, copiati qui e serviti in locale. Il browser li
risolve con la importmap dichiarata in `index.html`, i test con
`test/resolve-three.mjs`, che mappa gli stessi specifier agli stessi file.

Licenza MIT, © three.js authors. Vedi https://github.com/mrdoob/three.js

## Modifiche rispetto a upstream

Due file non sono identici a upstream. Vanno riapplicate a mano a ogni aggiornamento
di three.

### `UnrealBloomPass.js`, fork funzionale

Il bloom di upstream ridisegna tutti i mip a ogni frame, ed e' il costo GPU singolo
piu' alto della scena. Il fork aggiunge tre leve, usate da `src/main.js`:

| Campo | Cosa fa |
| --- | --- |
| `activeMips` | quanti dei `nMips` livelli vengono davvero elaborati |
| `updateStride` | ogni quanti frame il bloom viene ricalcolato |
| `_hasCachedBloom` | se esiste un risultato riusabile dal frame precedente |

Con `updateStride > 1` il pass riusa il bloom in cache nei frame intermedi invece di
rifarlo, e `activeMips` accorcia la catena di blur. `_hasCachedBloom` va rimesso a
`false` quando la scena cambia abbastanza da rendere la cache sbagliata: lo fa
`src/main.js` a ogni resize, cambio di risoluzione e ritorno a `updateStride = 1`.

Commit di riferimento: `60d65f0` (reduce bloom gpu cost) e `7c98c05` (cache bloom frames).

`_hasCachedBloom` ha un underscore ma viene scritto da fuori: e' un campo privato per
convenzione a cui `src/` accede lo stesso. Andrebbe promosso a metodo pubblico, per
esempio `invalidateBloomCache()`.

### `GLTFLoader.js`, solo percorsi

Gli import di `BufferGeometryUtils` e `SkeletonUtils` passano da `../utils/` a `./`,
perche' qui gli addons stanno tutti nella stessa cartella invece che nell'albero
`examples/jsm/` di upstream. Nessun cambiamento di comportamento.

Tutti gli altri file sono copie non modificate.
