class ResponsePayload {
    statusCode: number;
    body: string;
}

enum StatusCode {
    success = 200,
    error = 500
}

class Result {
    private statusCode: number;
    private message: string;
    private data?: unknown;

    constructor(statusCode: number, message: string, data?: unknown) {
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
    }

    bodyToString() {
        return {
            statusCode: this.statusCode,
            body: JSON.stringify({
                message: this.message,
                data: this.data,
            }),
        };
    }
}

export class Response {
    static success(data: unknown, code?: number): ResponsePayload {
        const statusCode = code | StatusCode.success;
        const result = new Result(statusCode, 'success', data);

        return result.bodyToString();
    }

    static error(e : unknown, code?: number) {
        const statusCode = code | StatusCode.error;
        const message = (e as Error).message;
        const result = new Result(statusCode, `[InternalServerError] ${message}`);

        return result.bodyToString();
    }
}