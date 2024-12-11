export class RandomData {
  string(length: number) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  num(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
