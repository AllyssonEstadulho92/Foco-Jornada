// Compatibilidade 4.2.0.
// O módulo Vida pessoal / Tempo a dois foi retirado do runtime por opção do utilizador.
// Mantemos este ficheiro temporariamente porque versões em cache de controls.js ainda o podem importar.
// Não cria cartões, lembretes, notificações, horários nem altera dados locais.

document.querySelector('#coupleTodayCard')?.remove();
document.querySelector('#coupleHubSection')?.remove();
document.querySelector('#couplePanel')?.remove();
document.body.classList.remove('couple-open');

export {};
