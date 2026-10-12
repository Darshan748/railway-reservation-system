/**
 * Hand-written data structures and algorithms used by the app and the
 * "DSA Concepts" page. These are TypeScript demonstrations, not the C++
 * implementation required by the college assignment.
 */

/** FIFO queue backed by an array with a moving head index (O(1) amortised ops). */
export class Queue<T> {
  private items: T[] = [];
  private head = 0;

  constructor(initial: T[] = []) {
    for (const item of initial) this.enqueue(item);
  }
  enqueue(item: T): void {
    this.items.push(item);
  }
  dequeue(): T | undefined {
    if (this.isEmpty()) return undefined;
    const item = this.items[this.head]!;
    this.head++;
    if (this.head > 32 && this.head * 2 > this.items.length) {
      this.items = this.items.slice(this.head);
      this.head = 0;
    }
    return item;
  }
  peek(): T | undefined {
    return this.isEmpty() ? undefined : this.items[this.head]!;
  }
  size(): number {
    return this.items.length - this.head;
  }
  isEmpty(): boolean {
    return this.size() === 0;
  }
  toArray(): T[] {
    const out: T[] = [];
    for (let i = this.head; i < this.items.length; i++) out.push(this.items[i]!);
    return out;
  }
}

/** Singly linked list node. */
export class ListNode<T> {
  constructor(
    public value: T,
    public next: ListNode<T> | null = null,
  ) {}
}

/** Singly linked list with insert, delete and traversal. */
export class LinkedList<T> {
  head: ListNode<T> | null = null;
  private length = 0;

  insertAtHead(value: T): void {
    this.head = new ListNode(value, this.head);
    this.length++;
  }
  insertAtEnd(value: T): void {
    const node = new ListNode(value);
    if (!this.head) {
      this.head = node;
    } else {
      let cur = this.head;
      while (cur.next) cur = cur.next;
      cur.next = node;
    }
    this.length++;
  }
  /** Deletes the first node matching the predicate. Returns true if removed. */
  delete(match: (v: T) => boolean): boolean {
    if (!this.head) return false;
    if (match(this.head.value)) {
      this.head = this.head.next;
      this.length--;
      return true;
    }
    let prev = this.head;
    let cur = this.head.next;
    while (cur) {
      if (match(cur.value)) {
        prev.next = cur.next;
        this.length--;
        return true;
      }
      prev = cur;
      cur = cur.next;
    }
    return false;
  }
  traverse(): T[] {
    const out: T[] = [];
    let cur = this.head;
    while (cur) {
      out.push(cur.value);
      cur = cur.next;
    }
    return out;
  }
  size(): number {
    return this.length;
  }
}

export interface LinearSearchResult {
  index: number;
  comparisons: number;
  steps: string[];
}

/** Linear search: O(n). Checks each element in order. */
export function linearSearch<T>(
  items: T[],
  matches: (item: T) => boolean,
  label: (item: T) => string = String,
): LinearSearchResult {
  const steps: string[] = [];
  let comparisons = 0;
  for (let i = 0; i < items.length; i++) {
    comparisons++;
    const hit = matches(items[i]!);
    steps.push(`Index ${i}: compare ${label(items[i]!)} → ${hit ? "match" : "no match"}`);
    if (hit) return { index: i, comparisons, steps };
  }
  return { index: -1, comparisons, steps };
}

export interface BinaryStep {
  low: number;
  high: number;
  mid: number;
  midKey: string;
  decision: string;
}

export interface BinarySearchResult {
  index: number;
  comparisons: number;
  steps: BinaryStep[];
}

/** Binary search on items sorted ascending by key: O(log n). */
export function binarySearch<T>(
  sorted: T[],
  target: string,
  key: (item: T) => string,
): BinarySearchResult {
  let low = 0;
  let high = sorted.length - 1;
  let comparisons = 0;
  const steps: BinaryStep[] = [];
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const midKey = key(sorted[mid]!);
    comparisons++;
    if (midKey === target) {
      steps.push({ low, high, mid, midKey, decision: "Found" });
      return { index: mid, comparisons, steps };
    }
    if (compareKeys(midKey, target) < 0) {
      steps.push({ low, high, mid, midKey, decision: `${midKey} < ${target} → search right half` });
      low = mid + 1;
    } else {
      steps.push({ low, high, mid, midKey, decision: `${midKey} > ${target} → search left half` });
      high = mid - 1;
    }
  }
  return { index: -1, comparisons, steps };
}

/** Numeric-aware comparison so "9" < "12" for train numbers. */
export function compareKeys(a: string | number, b: string | number): number {
  const na = Number(a);
  const nb = Number(b);
  if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
  return String(a) < String(b) ? -1 : String(a) > String(b) ? 1 : 0;
}

export function isSortedBy<T>(items: T[], key: (item: T) => string | number): boolean {
  for (let i = 1; i < items.length; i++) {
    if (compareKeys(key(items[i - 1]!), key(items[i]!)) > 0) return false;
  }
  return true;
}

export interface BubbleSortResult<T> {
  sorted: T[];
  comparisons: number;
  swaps: number;
}

/** Bubble sort (stable, with early exit): O(n²) worst, O(n) best. Does not mutate input. */
export function bubbleSort<T>(
  items: T[],
  key: (item: T) => string | number,
  direction: "asc" | "desc" = "asc",
): BubbleSortResult<T> {
  const arr = items.slice();
  let comparisons = 0;
  let swaps = 0;
  const sign = direction === "asc" ? 1 : -1;
  for (let i = 0; i < arr.length - 1; i++) {
    let swapped = false;
    for (let j = 0; j < arr.length - 1 - i; j++) {
      comparisons++;
      if (sign * compareKeys(key(arr[j]!), key(arr[j + 1]!)) > 0) {
        const tmp = arr[j]!;
        arr[j] = arr[j + 1]!;
        arr[j + 1] = tmp;
        swaps++;
        swapped = true;
      }
    }
    if (!swapped) break;
  }
  return { sorted: arr, comparisons, swaps };
}
