export type AsyncHandler = (req: any, res: any, next: any) => Promise<any> | any;
export function ah(fn: AsyncHandler) {
  return function wrapped(req: any, res: any, next: any) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}