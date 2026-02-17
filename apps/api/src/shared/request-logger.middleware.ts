import { Injectable, NestMiddleware } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    res.on("finish", () => {
      const elapsedMs = Date.now() - start;
      const safePath = req.originalUrl.split("?")[0];
      // Intentionally omit request body/headers to avoid leaking secrets.
      console.info(`[${new Date().toISOString()}] ${req.method} ${safePath} ${res.statusCode} ${elapsedMs}ms`);
    });
    next();
  }
}
