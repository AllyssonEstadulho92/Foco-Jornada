# Notas de Foco

O temporizador usa timestamps persistidos como fonte de verdade. `setInterval`/re-render apenas atualiza a apresentação; não acumula tempo de negócio.

Sessões abertas são `running` ou `paused`. Ao terminar uma jornada, uma sessão ainda aberta é cancelada no mesmo instante antes do encerramento da jornada.
