const BASE = "https://api.trello.com/1";

export interface TrelloCard {
  id: string;
  name: string;
  desc: string;
  url: string;
  due: string | null;
  idList: string;
  labels: { id: string; name: string; color: string }[];
}

export interface TrelloList {
  id: string;
  name: string;
}

export interface TrelloComment {
  id: string;
  text: string;
  date: string;
  author: string;
}

type RequestParams = Record<string, string>;

export class TrelloClient {
  private key: string;
  private token: string;
  private boardId: string;
  private listCache: Map<string, TrelloList> | null = null;

  constructor(key: string, token: string, boardId: string) {
    if (!key || !token || !boardId) {
      throw new Error("TRELLO_KEY, TRELLO_TOKEN, TRELLO_BOARD_ID required");
    }
    this.key = key;
    this.token = token;
    this.boardId = boardId;
  }

  private async request<T>(
    path: string,
    params: RequestParams = {},
    init: RequestInit = {},
  ): Promise<T> {
    const url = new URL(`${BASE}${path}`);
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
    url.searchParams.set("key", this.key);
    url.searchParams.set("token", this.token);

    let attempt = 0;
    let lastErr: unknown;
    while (attempt < 3) {
      try {
        const res = await fetch(url, init);
        if (res.status === 429) {
          await sleep(2000 * Math.pow(2, attempt));
          attempt++;
          lastErr = new Error("Trello 429: rate limited");
          continue;
        }
        if (!res.ok) {
          throw new Error(`Trello ${res.status}: ${await res.text()}`);
        }
        return (await res.json()) as T;
      } catch (e) {
        lastErr = e;
        attempt++;
        await sleep(500 * attempt);
      }
    }
    throw lastErr ?? new Error("Trello request failed: max retries exceeded");
  }

  async getLists(): Promise<TrelloList[]> {
    return this.request<TrelloList[]>(`/boards/${this.boardId}/lists`);
  }

  private async listIdByName(name: string): Promise<string> {
    if (!this.listCache) {
      const lists = await this.getLists();
      this.listCache = new Map(lists.map((l) => [l.name, l]));
    }
    const list = this.listCache.get(name);
    if (!list) {
      throw new Error(`List "${name}" not found on board`);
    }
    return list.id;
  }

  async listCards(listName: string): Promise<TrelloCard[]> {
    const listId = await this.listIdByName(listName);
    return this.request<TrelloCard[]>(`/lists/${listId}/cards`);
  }

  async getCard(cardId: string): Promise<TrelloCard & { comments: TrelloComment[] }> {
    const card = await this.request<TrelloCard>(`/cards/${cardId}`);
    type Action = { id: string; date: string; data: { text?: string }; memberCreator: { fullName: string } };
    const actions = await this.request<Action[]>(
      `/cards/${cardId}/actions`,
      { filter: "commentCard" },
    );
    const comments: TrelloComment[] = actions
      .filter((a): a is Action & { data: { text: string } } => typeof a.data?.text === "string" && a.data.text.length > 0)
      .map((a) => ({
        id: a.id,
        text: a.data.text,
        date: a.date,
        author: a.memberCreator.fullName,
      }));
    return { ...card, comments };
  }

  async moveCard(cardId: string, targetListName: string): Promise<void> {
    const targetId = await this.listIdByName(targetListName);
    await this.request(`/cards/${cardId}`, { idList: targetId }, { method: "PUT" });
  }

  async commentCard(cardId: string, text: string): Promise<{ id: string }> {
    const r = await this.request<{ id: string }>(
      `/cards/${cardId}/actions/comments`,
      { text },
      { method: "POST" },
    );
    return { id: r.id };
  }

  async getBoardSummary(): Promise<{ lists: { name: string; count: number }[] }> {
    const lists = await this.getLists();
    const counts = await Promise.all(
      lists.map(async (l) => {
        const cards = await this.request<TrelloCard[]>(`/lists/${l.id}/cards`);
        return { name: l.name, count: cards.length };
      }),
    );
    return { lists: counts };
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
