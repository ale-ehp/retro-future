# Frasi della folla

I personaggi della folla dicono una frase quando il player si avvicina.

## Come funziona

- raggio di attivazione 15 m, si ri-arma oltre i 18 m, cosi' una frase non riparte
  a ripetizione mentre cammini avanti e indietro sulla stessa soglia
- ogni personaggio riceve 3 frasi pescate dal pool in modo deterministico dal suo
  indice, quindi lo stesso personaggio dice sempre le stesse tre frasi
- il fumetto resta a schermo 4 secondi
- parlano insieme solo i personaggi piu' vicini

Tutti questi valori sono le costanti esportate accanto al pool.

## Sorgente

Il pool e la logica di scelta stanno in
[`src/character/runner-crowd-lines.js`](../src/character/runner-crowd-lines.js),
che e' l'unica sorgente: qui non c'e' una copia da tenere sincronizzata.
Le frasi sono raggruppate per categoria dai commenti nel file.

## Regole del copy

Chi aggiunge frasi le rispetta, e `test/frasi-folla.test.mjs` le verifica:

- niente trattini lunghi o corti come punteggiatura, si usano virgola e punto
- il brand si scrive `avstudio`, sempre minuscolo
- frasi corte, devono stare in una o due righe dentro il fumetto
- tono mai vanitoso, il mondo di avstudio si racconta di sbieco e non si vende
