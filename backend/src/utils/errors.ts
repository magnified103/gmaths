export class ServiceError extends Error {
    code: number;
    errors: { locationType: string | undefined; location: string | undefined; message: string }[];

    constructor(message: string, code: number = 500, errors: { locationType: string | undefined; location: string | undefined; message: string }[] = []) {
        super(message);
        this.code = code;
        this.errors = errors;
    }
}

export class NotFoundError extends ServiceError {
    constructor(message: string = 'Resource not found') {
        super(message, 404);
    }
}
