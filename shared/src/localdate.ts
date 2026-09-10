import { isDate, isNumber } from "./types.ts";

/**
 * A tuple consisting of a year, a month, and a day of the month,
 * all in the local timezone.
 */
export class LocalDate {
  /** The year number in a local timezone, four digits. */
  readonly year: number;
  /** The month number in a local timezone, 1-12. */
  readonly month: number;
  /** The day of month number in a local timezone, 1-31. */
  readonly dayOfMonth: number;
  /** The day of week number in a local timezone, 1-7. */
  readonly dayOfWeek: number;
  /** The timestamp of local midnight, milliseconds since the Unix epoch. */
  readonly timestamp: number;
  /** The string value formatted as YYYY-MM-DD. */
  readonly value: string;

  static now(): LocalDate {
    return new LocalDate(Date.now());
  }

  /**
   * Creates a local date with the given year, month, and day.
   * @param year A year number, four digits.
   * @param month A month number, 1-12.
   * @param day A day of the month number, 1-31.
   */
  constructor(year: number, month: number, day: number);
  /**
   * Creates a local date from the given timestamp in the UTC zone.
   * @param timestamp A timestamp in the UTC timezone, milliseconds.
   */
  constructor(timestamp: number);
  /**
   * Creates a local date from the given date instance.
   * @param date A date instance.
   */
  constructor(date: Date);
  constructor(...args: any[]) {
    const { length } = args;
    let year: number;
    let month: number;
    let day: number;
    let timestamp: number;
    let date: Date;
    if (length === 3 && isNumber((year = args[0])) && isNumber((month = args[1])) && isNumber((day = args[2]))) {
      if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
        throw new RangeError("year, month, and day must be integers");
      }
      date = new Date(year, month - 1, day);
      if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
        throw new RangeError("year, month, and day must form a valid date");
      }
    } else if (length === 1 && isNumber((timestamp = args[0]))) {
      date = dateFromTimeStamp(timestamp);
    } else if (length === 1 && isDate((date = args[0]))) {
      date = dateFromTimeStamp(date.getTime());
    } else {
      throw new TypeError();
    }
    date.setHours(0);
    date.setMinutes(0);
    date.setSeconds(0);
    date.setMilliseconds(0);
    this.year = date.getFullYear();
    this.month = date.getMonth() + 1;
    this.dayOfMonth = date.getDate();
    let dayOfWeek = date.getDay();
    if (dayOfWeek === 0) {
      dayOfWeek = 7;
    }
    this.dayOfWeek = dayOfWeek;
    this.timestamp = date.getTime();
    this.value =
      String(this.year) + "-" + String(this.month).padStart(2, "0") + "-" + String(this.dayOfMonth).padStart(2, "0");
    return Object.freeze(this);
  }

  plusDays(days: number): LocalDate {
    assertWholeDays(days);
    const date = new Date(this.timestamp);
    date.setDate(date.getDate() + days);
    return new LocalDate(date);
  }

  minusDays(days: number): LocalDate {
    assertWholeDays(days);
    const date = new Date(this.timestamp);
    date.setDate(date.getDate() - days);
    return new LocalDate(date);
  }

  startOfWeek(): LocalDate {
    const date = new Date(this.timestamp);
    date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
    return new LocalDate(date);
  }

  toString(): string {
    return this.value;
  }

  valueOf(): number {
    return this.timestamp;
  }
}

export class LocalDateRange {
  readonly #from: LocalDate;
  readonly #to: LocalDate;

  constructor(from: LocalDate, to: LocalDate) {
    this.#from = from;
    this.#to = to;
  }

  get from(): LocalDate {
    return this.#from;
  }

  get to(): LocalDate {
    return this.#to;
  }

  includes(timestamp: number): boolean {
    return this.#from.timestamp <= timestamp && timestamp < this.#to.timestamp;
  }

  toString() {
    return `${this.#from} - ${this.#to}`;
  }
}

export class Yesterday extends LocalDateRange {
  constructor(now = LocalDate.now()) {
    super(now.minusDays(1), now);
  }
}

export class Today extends LocalDateRange {
  constructor(now = LocalDate.now()) {
    super(now, now.plusDays(1));
  }
}

function dateFromTimeStamp(timestamp: number): Date {
  if (!Number.isFinite(timestamp)) {
    throw new RangeError("timestamp must be finite");
  }
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    throw new RangeError("timestamp must be a valid date");
  }
  return date;
}

function assertWholeDays(days: number): void {
  if (!Number.isInteger(days)) {
    throw new RangeError("days must be a whole number");
  }
}
