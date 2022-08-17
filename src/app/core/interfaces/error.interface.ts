export interface IError {
  code?: number | string;
  name?: string;
  message?: string;
  messageToUser?: string;
  stack?: string;
}
