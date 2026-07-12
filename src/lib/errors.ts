export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

interface SupabaseLikeError {
  code?: string;
  message: string;
  details?: string;
  hint?: string;
}

export function databaseError(error: SupabaseLikeError): AppError {
  const message = error.message || "Database request failed";
  const lower = message.toLowerCase();

  if (lower.includes("idx_one_open_trip_per_vehicle")) {
    return new AppError(
      "VEHICLE_ALREADY_OUT",
      "This vehicle already has a trip currently out.",
      409,
    );
  }

  if (error.code === "23505" || lower.includes("duplicate key")) {
    return new AppError(
      "DUPLICATE_RECORD",
      "A record with the same unique value already exists.",
      409,
    );
  }

  if (
    lower.includes("insufficient stock") ||
    lower.includes("already been returned") ||
    lower.includes("two trips at the same time") ||
    lower.includes("one_open_trip")
  ) {
    return new AppError("CONFLICT", message, 409);
  }

  if (lower.includes("not found")) {
    return new AppError("NOT_FOUND", message, 404);
  }

  if (error.code === "P0001" || error.code === "23514" || error.code === "22P02") {
    return new AppError("INVALID_OPERATION", message, 400);
  }

  return new AppError("DATABASE_ERROR", message, 500, {
    code: error.code,
    details: error.details,
    hint: error.hint,
  });
}

export function unknownError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  if (error instanceof Error) {
    return new AppError("INTERNAL_ERROR", error.message, 500);
  }
  return new AppError("INTERNAL_ERROR", "An unexpected error occurred.", 500);
}
