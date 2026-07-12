import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError, unknownError } from "@/lib/errors";

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function apiError(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Please correct the highlighted fields.",
          details: error.flatten(),
        },
      },
      { status: 400 },
    );
  }

  const appError: AppError = unknownError(error);
  return NextResponse.json(
    {
      error: {
        code: appError.code,
        message: appError.message,
        details: appError.details,
      },
    },
    { status: appError.status },
  );
}
