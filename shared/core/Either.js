export class Left {
  constructor(value) { this.value = value; }
  isLeft() { return true; }
  isRight() { return false; }
}

export class Right {
  constructor(value) { this.value = value; }
  isLeft() { return false; }
  isRight() { return true; }
}

export const left = (l) => new Left(l);
export const right = (r) => new Right(r);