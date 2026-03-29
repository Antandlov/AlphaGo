export class TrieNode {
  children: Map<string, TrieNode>;
  isEndOfWord: boolean;
  data: any;

  constructor() {
    this.children = new Map();
    this.isEndOfWord = false;
    this.data = null;
  }
}

export class Trie {
  root: TrieNode;

  constructor() {
    this.root = new TrieNode();
  }

  private normalize(text: string): string {
    return text.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, " ");
  }

  insert(word: string, data?: any): void {
    const normalizedWord = this.normalize(word);
    let node = this.root;

    for (const char of normalizedWord) {
      if (!node.children.has(char)) {
        node.children.set(char, new TrieNode());
      }
      node = node.children.get(char)!;
    }

    node.isEndOfWord = true;
    node.data = data;
  }

  search(word: string): { found: boolean; data: any } {
    const normalizedWord = this.normalize(word);
    let node = this.root;

    for (const char of normalizedWord) {
      if (!node.children.has(char)) {
        return { found: false, data: null };
      }
      node = node.children.get(char)!;
    }

    return { found: node.isEndOfWord, data: node.data };
  }

  searchPrefix(prefix: string): any[] {
    const normalizedPrefix = this.normalize(prefix);
    let node = this.root;

    for (const char of normalizedPrefix) {
      if (!node.children.has(char)) {
        return [];
      }
      node = node.children.get(char)!;
    }

    const results: any[] = [];
    this.collectWords(node, results);
    return results;
  }

  private collectWords(node: TrieNode, results: any[]): void {
    if (node.isEndOfWord && node.data) {
      results.push(node.data);
    }

    for (const child of node.children.values()) {
      this.collectWords(child, results);
    }
  }

  contains(text: string, searchWord: string): boolean {
    const normalizedText = this.normalize(text);
    const normalizedSearch = this.normalize(searchWord);
    return normalizedText.includes(normalizedSearch);
  }
}

export function createIngredientTrie(ingredients: { name: string; data?: any }[]): Trie {
  const trie = new Trie();
  
  ingredients.forEach((ingredient) => {
    trie.insert(ingredient.name, ingredient.data || ingredient);
  });

  return trie;
}
