import type { Response } from "express";

class SSEManager {
  private clients = new Map<number, Set<Response>>();

  addClient(userId: number, res: Response): void {
    if (!this.clients.has(userId)) {
      this.clients.set(userId, new Set());
    }
    this.clients.get(userId)!.add(res);
  }

  removeClient(userId: number, res: Response): void {
    const set = this.clients.get(userId);
    if (set) {
      set.delete(res);
      if (set.size === 0) this.clients.delete(userId);
    }
  }

  emit(userId: number, event: string, data: unknown): void {
    const clients = this.clients.get(userId);
    if (!clients || clients.size === 0) return;
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const res of clients) {
      try {
        res.write(payload);
      } catch {
        clients.delete(res);
      }
    }
  }

  emitToMany(userIds: number[], event: string, data: unknown): void {
    for (const id of userIds) {
      this.emit(id, event, data);
    }
  }

  connectedCount(): number {
    let total = 0;
    for (const set of this.clients.values()) total += set.size;
    return total;
  }
}

export const sseManager = new SSEManager();
