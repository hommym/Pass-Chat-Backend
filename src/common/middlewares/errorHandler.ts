import { Request, Response, NextFunction } from "express";
import { MulterError } from "multer";

export class AppError extends Error {
  message: string;
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.message = message;
    this.statusCode = statusCode;
  }
}

export const errorHandler = async (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
  } else if (err instanceof SyntaxError) {
    res.status(400).json({ error: err.message });
  } else if (err instanceof MulterError) {
    res.status(400).json({ error: `${err.message} for uploaded file` });
  } else {
    console.log(err);
    res.status(500).json({ error: "Server Error" });
  }
};
