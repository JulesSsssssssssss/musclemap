/**
 * File d'attente des séries saisies hors ligne, gardée dans le localStorage de l'appareil.
 * Les modifications d'une même série sont fusionnées : seule la dernière valeur de chaque champ compte.
 */

type Item = { setId: string };

export function readQueue<T extends Item>(key: string): T[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write<T extends Item>(key: string, items: T[]) {
  try {
    if (items.length) localStorage.setItem(key, JSON.stringify(items));
    else localStorage.removeItem(key);
  } catch {
    // stockage indisponible (navigation privée, quota) : la modification reste seulement à l'écran
  }
  return items.length;
}

/** Ajoute (ou fusionne) une modification ; renvoie le nombre de séries en attente. */
export function enqueue<T extends Item>(key: string, input: T): number {
  const items = readQueue<T>(key);
  const at = items.findIndex((i) => i.setId === input.setId);
  if (at === -1) items.push(input);
  else items[at] = { ...items[at], ...input };
  return write(key, items);
}

/** Retire une série de la file ; renvoie le nombre de séries encore en attente. */
export function dequeue<T extends Item>(key: string, setId: string): number {
  return write(
    key,
    readQueue<T>(key).filter((i) => i.setId !== setId),
  );
}
